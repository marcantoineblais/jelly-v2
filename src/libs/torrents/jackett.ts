import { JACKETT_API_KEY, JACKETT_URL } from "@/src/config";
import { XMLParser } from "fast-xml-parser";

export type TorrentSearchItem = {
  id: number;
  title: string;
  link: string;
  magnet: string | null;
  pubDate: string;
  pubDateMs: number;
  size: string | null;
  seeds: number | null;
  leech: number | null;
  source: string;
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

function parseTorznabXml(
  xml: string,
  defaultSource: string,
): TorznabParseResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) return { items: [], total: null };

  const response =
    doc?.rss?.["newznab:response"] ??
    doc?.rss?.["newznab_response"] ??
    channel["newznab:response"] ??
    channel["newznab_response"];
  const totalRaw =
    response?.["@_total"] ?? response?.total;
  const total =
    totalRaw != null && totalRaw !== ""
      ? parseInt(String(totalRaw), 10)
      : null;
  if (total !== null && !Number.isFinite(total)) return { items: [], total: null };

  const rawItems = channel.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  const result = items.map((it, index) => {
    const title = it.title ?? "";
    const link = it.link ?? "";
    const enclosure = it.enclosure;
    const enclosureUrl =
      typeof enclosure === "string"
        ? enclosure
        : (enclosure?.["@_url"] ?? enclosure?.url ?? "");
    const enclosureLength =
      typeof enclosure === "object" && enclosure != null
        ? enclosure["@_length"] ?? enclosure.length
        : undefined;
    let magnet: string | null = link?.startsWith("magnet:")
      ? link
      : enclosureUrl?.startsWith("magnet:")
        ? enclosureUrl
        : enclosureUrl && /\.torrent(\?|$)/i.test(enclosureUrl)
          ? enclosureUrl
          : null;
    const pubDate = it.pubDate ?? it["dc:date"] ?? "";
    const pubDateMs = pubDate ? new Date(pubDate).getTime() : 0;

    let size: string | null = null;
    let seeds: number | null = null;
    let leech: number | null = null;
    let itemSource = defaultSource;
    // torznab:attr can appear as "torznab:attr", "attr", or (with some parsers) under a namespace key
    const attrs =
      it["torznab:attr"] ??
      it.attr ??
      it["torznab_attr"] ??
      (() => {
        const key = Object.keys(it).find(
          (k) =>
            (k === "attr" ||
              k.endsWith(":attr") ||
              k.endsWith("_attr")) &&
            (Array.isArray(it[k as keyof typeof it]) ||
              (typeof it[k as keyof typeof it] === "object" &&
                it[k as keyof typeof it] != null)),
        );
        return key ? (it as Record<string, unknown>)[key] : undefined;
      })();
    const attrList = Array.isArray(attrs) ? attrs : attrs ? [attrs] : [];
    for (const a of attrList) {
      const raw = a as Record<string, unknown>;
      const name = String(
        raw["@_name"] ?? raw.name ?? "",
      ).toLowerCase();
      const val = raw["@_value"] ?? raw.value;
      if (name === "size" && val != null && val !== "") size = formatSize(Number(val));
      if (name === "seeders" && val != null) seeds = parseInt(String(val), 10);
      if (name === "peers" && val != null && leech == null)
        leech = parseInt(String(val), 10);
      if (name === "leechers" && val != null) leech = parseInt(String(val), 10);
      if ((name === "jackettindexer" || name === "indexer") && val != null)
        itemSource = String(val).trim();
      if (name === "magneturl" && val != null) {
        const s = String(val).trim();
        if (s.startsWith("magnet:")) magnet = s;
      }
    }
    // Fallback 1: size from RSS enclosure length (bytes)
    if (size == null && enclosureLength != null) {
      const n = Number(enclosureLength);
      if (Number.isFinite(n) && n > 0) size = formatSize(n);
    }
    // Fallback 2: some feeds use a <size> child element (bytes)
    if (size == null && it.size != null) {
      const raw =
        typeof it.size === "object" && it.size != null && "#text" in it.size
          ? (it.size as { "#text"?: unknown })["#text"]
          : it.size;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) size = formatSize(n);
    }
    // Source: when searching "all", Jackett may send indexer as child element <jackettindexer>...</jackettindexer>
    if (itemSource === defaultSource) {
      const raw =
        it.jackettindexer ??
        (it as Record<string, unknown>).JackettIndexer ??
        (it as Record<string, unknown>)["jackett:indexer"];
      const name =
        typeof raw === "object" && raw != null && "#text" in raw
          ? (raw as { "#text"?: string })["#text"]
          : raw;
      if (name != null && String(name).trim()) itemSource = String(name).trim();
    }
    if (seeds != null && leech == null) leech = 0;

    return {
      id: index,
      title,
      link,
      magnet,
      pubDate,
      pubDateMs,
      size,
      seeds,
      leech,
      source: itemSource,
    };
  });

  return { items: result, total };
}

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
    .map((i) => ({
      id:
        (i as { ID?: string; Id?: string }).ID ??
        (i as { id?: string }).id ??
        "",
      name:
        (i as { Name?: string }).Name ??
        (i as { name?: string }).name ??
        (i as { ID?: string }).ID ??
        "",
    }))
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
  indexerIds?: string[],
  options: SearchJackettOptions = {},
): Promise<SearchJackettResult> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }

  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const q = query.trim();
  if (!q) return { items: [], total: null };

  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, Math.min(100, options.limit ?? 25));
  const useAll = !indexerIds || indexerIds.length === 0;

  if (useAll) {
    const params = new URLSearchParams({
      apikey: JACKETT_API_KEY,
      t: "search",
      extended: "1",
      q,
      offset: String(offset),
      limit: String(limit),
    });
    const url = `${baseUrl}/api/v2.0/indexers/all/results/torznab/api?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jackett search: ${res.status}`);
    const xml = await res.text();
    const parsed = parseTorznabXml(xml, "all");
    parsed.items.sort((a, b) => b.pubDateMs - a.pubDateMs);
    const items =
      parsed.items.length > limit ? parsed.items.slice(0, limit) : parsed.items;
    return { items, total: parsed.total };
  }

  const allResults: TorrentSearchItem[] = [];
  const perIndexerLimit = Math.min(100, offset + limit);
  const settled = await Promise.allSettled(
    indexerIds.map(async (id) => {
      const params = new URLSearchParams({
        apikey: JACKETT_API_KEY,
        t: "search",
        extended: "1",
        q,
        offset: "0",
        limit: String(perIndexerLimit),
      });
      const url = `${baseUrl}/api/v2.0/indexers/${encodeURIComponent(id)}/results/torznab/api?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const xml = await res.text();
      const parsed = parseTorznabXml(xml, id);
      return parsed.items.filter(
        (item) => item.magnet != null && item.magnet.length > 0,
      );
    }),
  );
  for (const r of settled) {
    if (r.status === "fulfilled") allResults.push(...r.value);
  }
  allResults.sort((a, b) => b.pubDateMs - a.pubDateMs);
  const items = allResults.slice(offset, offset + limit);
  return { items, total: allResults.length };
}
