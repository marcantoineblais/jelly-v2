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

export type JackettIndexer = {
  id: string;
  name: string;
  limit: number;
  categories: TorznabCategory[];
};

export type TorznabCategory = {
  id: string;
  name: string;
};

export type TorznabParseResult = {
  items: TorrentSearchItem[];
  total: number | null;
};

export type JackettIndexersResult = {
  indexers: JackettIndexer[];
};

export type JackettRawIndexer = {
  id: string;
  title: string;
  caps?: {
    limits?: { max?: number; default?: number };
    categories?: {
      category?: JackettRawCategory[];
    };
  };
};

export type JackettRawCategory = {
  id: string;
  name: string;
  subcat?: JackettRawCategory[] | JackettRawCategory;
};
/**
 * Fetch configured indexers and their caps from Jackett via the Torznab API (t=indexers).
 * The response includes indexers and caps/categories in a single request.
 */
export async function getJackettIndexers(): Promise<JackettIndexersResult> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }
  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const searchParams = new URLSearchParams({
    apikey: JACKETT_API_KEY,
    t: "indexers",
    configured: "true",
  });
  const url = `${baseUrl}/api/v2.0/indexers/all/results/torznab/api?${searchParams}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jackett indexers: ${res.status}`);
  }
  const text = await res.text();
  return parseTorznabIndexersXml(text);
}

/** Normalize XML-parsed value to array (single item becomes [item], null/undefined becomes []). */
function ensureArray<T>(x: T | T[] | null | undefined): T[] {
  if (Array.isArray(x)) return x;
  if (x != null) return [x];
  return [];
}

/** Parse Torznab t=indexers XML response into indexers with their caps. */
function parseTorznabIndexersXml(xml: string): JackettIndexersResult {
  const trimmed = xml.trim();
  if (!trimmed) return { indexers: [] };

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    transformAttributeName: (attributeName) => attributeName.replace("@_", ""),
  });
  const doc = parser.parse(xml);
  const rawIndexers = ensureArray<JackettRawIndexer>(doc?.indexers?.indexer);
  const formattedIndexers = rawIndexers.map((indexer) => {
    const id = indexer.id;
    const name = indexer.title;
    const caps = indexer.caps;
    const limit = Number(caps?.limits?.max ?? caps?.limits?.default ?? "");
    const categories = ensureArray<JackettRawCategory>(caps?.categories?.category);
    const formattedCategories = categories
      .map((category) => {
        const id = category.id;
        const name = category.name;
        const subCategories = ensureArray<JackettRawCategory>(category.subcat);
        const formattedSubCategories = subCategories.map((subCategory) => {
          const id = subCategory.id;
          const name = subCategory.name;
          return { id, name };
        });

        return [{ id, name }, ...formattedSubCategories];
      })
      .flat()
      .filter(
        (category, i, array) =>
          i === array.findIndex((c) => c.id === category.id),
      )
      .sort((a, b) => a.id.localeCompare(b.id));
    return { id, name, limit, categories: formattedCategories };
  });

  return { indexers: formattedIndexers };
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
    transformAttributeName: (attributeName) =>
      attributeName.replace("@_", "").replace(":", "_"),
    transformTagName: (tagName) => tagName.replace(":", "_"),
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) return [];
  const rawItems = channel.item;
  const items = ensureArray<typeof rawItems>(rawItems);
  return items.map((item, index) => {
    const title = item.title ?? "";
    const url = item.link ?? "";
    const rawPubDate = item.pubDate ?? "";
    const pubDateMs = rawPubDate ? new Date(rawPubDate).getTime() : 0;
    const pubDate = formatDate(rawPubDate);
    const size = formatDataSize(item.size);
    const attrs = item.torznab_attr ?? [];
    const seeds = attrs?.find((a: any) => a.name === "seeders")?.value ?? 0;
    const leech =
      attrs?.find((a: any) => a.name === "leechers" || a.name === "peers")
        ?.value ?? 0;
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
