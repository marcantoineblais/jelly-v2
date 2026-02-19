import { JACKETT_API_KEY, JACKETT_URL } from "@/src/config";
import { XMLParser } from "fast-xml-parser";
import { log } from "../logger";

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

function formatSize(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return "";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

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
  const url = `${baseUrl}/api/v2.0/indexers/all/Results?apikey=${encodeURIComponent(JACKETT_API_KEY)}&query=a`;
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

export type SearchJackettOptions = {
  offset?: number;
  limit?: number;
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
  options: SearchJackettOptions = {},
): Promise<SearchJackettResult> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }

  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const q = query.trim();
  if (!q) return { items: [], total: null };

  const useAll = !indexerId || indexerId === "all";
  const path = useAll ? "all" : indexerId;
  const response = await fetch(
    `${baseUrl}/api/v2.0/indexers/${path}/results/torznab/api?apikey=${JACKETT_API_KEY}&t=search&q=${q}`,
  );
  if (!response.ok) throw new Error(`Jackett search: ${response.status}`);
  const data = await response.text();
  log({
    source: "searchJackett",
    message: "Torznab response: ",
    data,
  });
  const items = parseTorznabXml(data);
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
  log({
    source: "parseTorznabXml",
    message: "Items: ",
    data: items,
  });
  return items.map((item, index) => {
    const title = item.title ?? "";
    const url = item.link ?? "";
    const pubDate = item.pubDate ?? "";
    const pubDateMs = pubDate ? new Date(pubDate).getTime() : 0;
    const size = formatSize(Number(item.size ?? "0"));
    const attrs = item["torznab:attr"];
    const seeds =
      attrs?.find((a: any) => a["@_name"] === "seeders")?.["@_value"] ?? 0;
    const leech =
      attrs?.find(
        (a: any) => a["@_name"] === "leechers" || a["@_name"] === "peers",
      )?.["@_value"] ?? 0;
      log({
        source: "url",
        message: "URL: ",
        data: url,
      });
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
