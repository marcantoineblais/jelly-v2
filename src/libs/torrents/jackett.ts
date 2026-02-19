import { XMLParser } from "fast-xml-parser";

export type TorrentSearchItem = {
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

const JACKETT_URL = process.env.JACKETT_URL ?? "http://localhost:9117";
const JACKETT_API_KEY = process.env.JACKETT_API_KEY ?? "";

function formatSize(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return "";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function parseTorznabXml(xml: string, defaultSource: string): TorrentSearchItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) return [];
  const rawItems = channel.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  const result: TorrentSearchItem[] = [];

  for (const it of items) {
    const title = it.title ?? "";
    const link = it.link ?? "";
    const enclosure = it.enclosure;
    const enclosureUrl =
      typeof enclosure === "string"
        ? enclosure
        : enclosure?.["@_url"] ?? enclosure?.url ?? "";
    const magnet =
      link?.startsWith("magnet:")
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
    const attrs = it["torznab:attr"] ?? it.attr;
    const attrList = Array.isArray(attrs) ? attrs : attrs ? [attrs] : [];
    for (const a of attrList) {
      const name = (a["@_name"] ?? a.name ?? "").toLowerCase();
      const val = a["@_value"] ?? a.value;
      if (name === "size" && val != null)
        size = formatSize(Number(val));
      if (name === "seeders" && val != null) seeds = parseInt(String(val), 10);
      if (name === "peers" && val != null && leech == null)
        leech = parseInt(String(val), 10);
      if (name === "leechers" && val != null) leech = parseInt(String(val), 10);
      if (name === "jackettindexer" && val != null) itemSource = String(val);
    }
    if (seeds != null && leech == null) leech = 0;

    result.push({
      title,
      link,
      magnet,
      pubDate,
      pubDateMs,
      size,
      seeds,
      leech,
      source: itemSource,
    });
  }
  return result;
}

/**
 * Search Jackett using the "all" indexer (single Torznab request).
 * This avoids the /api/v2.0/indexers list endpoint, which returns 400 when
 * Jackett has admin auth enabled and only accepts cookie-based login.
 */
export async function searchJackett(query: string): Promise<TorrentSearchItem[]> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }

  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const q = query.trim();
  if (!q) return [];

  const url = `${baseUrl}/api/v2.0/indexers/all/results/torznab/api?apikey=${encodeURIComponent(JACKETT_API_KEY)}&t=search&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jackett search: ${res.status}`);
  }
  const xml = await res.text();
  const results = parseTorznabXml(xml, "all");
  results.sort((a, b) => b.pubDateMs - a.pubDateMs);
  return results;
}
