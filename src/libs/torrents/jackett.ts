import { JACKETT_API_KEY, JACKETT_URL } from "@/src/config";
import { XMLParser } from "fast-xml-parser";
import { formatDataSize } from "../format-data-size";
import { formatDate, sortFeedItems, type SortBy } from "./feed-format";

export type TorrentSearchItem = {
  id: number;
  title: string;
  url: string;
  pubDate: string;
  pubDateMs: number;
  size: string | null;
  seeds: number | null;
  leech: number | null;
};

export type JackettIndexer = { id: string; name: string };

export type TorznabCategory = {
  id: number;
  name: string;
  subcats?: TorznabCategory[];
};

export type TorznabCaps = {
  server?: { version?: string; title?: string };
  limits?: { max?: number; default?: number };
  categories: TorznabCategory[];
};

export type TorznabParseResult = {
  items: TorrentSearchItem[];
  total: number | null;
};

/**
 * Fetch configured indexers from Jackett via a dummy search to the JSON Results
 * endpoint (the v2.0/indexers list endpoint requires admin login, not API key).
 */
export async function getJackettIndexers(): Promise<JackettIndexer[]> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }
  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const url = `${baseUrl}/api/v2.0/indexers/configured/Results?apikey=${encodeURIComponent(JACKETT_API_KEY)}&query=a`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jackett indexers: ${res.status}`);
  }
  const data = (await res.json()) as {
    Indexers?: Array<{ ID?: string; Id?: string; Name?: string }>;
    indexers?: Array<{ id?: string; name?: string }>;
  };
  const raw = data?.Indexers ?? data?.indexers ?? [];
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((i) => {
      const id =
        (i as { ID?: string }).ID ??
        (i as { Id?: string }).Id ??
        (i as { id?: string }).id ??
        "";
      const name =
        (i as { Name?: string }).Name ?? (i as { name?: string }).name ?? id;
      return { id, name };
    })
    .filter((x) => x.id.length > 0)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
}

/**
 * Fetch Torznab capabilities (categories, limits, search modes) for an indexer.
 * Use indexerId "all" or empty for the aggregate; otherwise a specific indexer id.
 */
export async function getJackettCaps(indexerId: string): Promise<TorznabCaps> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }
  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const useAll = !indexerId || indexerId === "all";
  const path = useAll ? "all" : indexerId.trim().toLowerCase();
  const url = `${baseUrl}/api/v2.0/indexers/${path}/results/torznab/api?apikey=${encodeURIComponent(JACKETT_API_KEY)}&t=caps`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jackett caps: ${res.status}`);
  }
  const xml = await res.text();
  return parseTorznabCapsXml(xml);
}

/** XML parser output: attributes may be @_name or name depending on config */
type XmlAttrs = Record<string, unknown>;

function attr(obj: XmlAttrs | undefined, key: string): string {
  if (!obj) return "";
  const val = obj[`@_${key}`] ?? obj[key];
  return String(val ?? "");
}

function attrInt(obj: XmlAttrs | undefined, key: string): number {
  return parseInt(attr(obj, key) || "0", 10);
}

function toArray<T>(val: T | T[] | undefined): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function parseTorznabCategory(raw: XmlAttrs): TorznabCategory {
  const id = attrInt(raw, "id");
  const name = attr(raw, "name");
  const rawSubcats = toArray(raw.subcat ?? raw.subcategory);
  const subcats = rawSubcats.map((s) => ({
    id: attrInt(s as XmlAttrs, "id"),
    name: attr(s as XmlAttrs, "name"),
  }));
  return {
    id,
    name,
    subcats: subcats.length > 0 ? subcats : undefined,
  };
}

function parseTorznabCapsXml(xml: string): TorznabCaps {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const doc = parser.parse(xml);
  const caps = doc?.caps ?? doc?.torznab?.caps;
  if (!caps) return { categories: [] };

  const rawCategories = toArray(caps.categories?.category);
  const categories = rawCategories.map((c) =>
    parseTorznabCategory(c as XmlAttrs),
  );

  const server = caps.server
    ? {
        version: attr(caps.server as XmlAttrs, "version"),
        title: attr(caps.server as XmlAttrs, "title"),
      }
    : undefined;

  const limits = caps.limits
    ? {
        max: attrInt(caps.limits as XmlAttrs, "max"),
        default: attrInt(caps.limits as XmlAttrs, "default"),
      }
    : undefined;

  return { server, limits, categories };
}

export type SearchJackettOptions = {
  cat?: string;
  offset?: number;
  limit?: number;
  sortBy?: SortBy;
  sortOrder?: "asc" | "desc";
};

export type SearchJackettResult = {
  items: TorrentSearchItem[];
  total: number | null;
};

/**
 * Search Jackett. Uses "all" indexer when indexerIds is empty/omitted; otherwise
 * queries only the given indexer ids (Torznab per indexer).
 * Supports offset/limit for pagination (Torznab params); when using multiple indexers, offset/limit are applied after merging.
 */
export async function searchJackett(
  query: string,
  indexerId: string,
  options?: SearchJackettOptions,
): Promise<SearchJackettResult> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }

  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const q = query.trim();
  if (!q) return { items: [], total: null };

  const useAll = !indexerId || indexerId === "all";
  const path = useAll ? "all" : indexerId;
  const params = new URLSearchParams({
    apikey: JACKETT_API_KEY,
    t: "search",
    q,
  });
  if (options?.cat) params.set("cat", options.cat);
  if (options?.limit != null && options.limit > 0)
    params.set("limit", String(options.limit));
  if (options?.offset != null && options.offset >= 0)
    params.set("offset", String(options.offset));

  const response = await fetch(
    `${baseUrl}/api/v2.0/indexers/${path}/results/torznab/api?${params.toString()}`,
  );
  if (!response.ok) throw new Error(`Jackett search: ${response.status}`);
  const data = await response.text();
  let items = parseTorznabXml(data);
  if (options?.sortBy && options?.sortOrder) {
    items = sortFeedItems(items, options.sortBy, options.sortOrder);
  }
  return { items, total: items.length };
}

export function parseTorznabXml(xml: string): TorrentSearchItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) return [];
  const rawItems = channel.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return items.map((item, index) => {
    const title = item.title ?? "";
    const url = item.link ?? "";
    const rawPubDate = item.pubDate ?? "";
    const pubDateMs = rawPubDate ? new Date(rawPubDate).getTime() : 0;
    const pubDate = formatDate(rawPubDate);
    const size = formatDataSize(item.size);
    const attrs = item["torznab:attr"];
    const seeds =
      attrs?.find((a: any) => a["@_name"] === "seeders")?.["@_value"] ?? 0;
    const leech =
      attrs?.find(
        (a: any) => a["@_name"] === "leechers" || a["@_name"] === "peers",
      )?.["@_value"] ?? 0;
    return {
      id: index,
      title,
      url,
      pubDate,
      pubDateMs,
      size,
      seeds,
      leech,
    };
  });
}
