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

function parseTorznabXml(xml: string, source: string): TorrentSearchItem[] {
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
      source,
    });
  }
  return result;
}

async function getIndexerIds(): Promise<string[]> {
  const url = `${JACKETT_URL.replace(/\/$/, "")}/api/v2.0/indexers`;
  const res = await fetch(
    JACKETT_API_KEY ? `${url}?apikey=${encodeURIComponent(JACKETT_API_KEY)}` : url,
    {
      headers: JACKETT_API_KEY
        ? { "X-Api-Key": JACKETT_API_KEY }
        : undefined,
    },
  );
  if (!res.ok) throw new Error(`Jackett indexers: ${res.status}`);
  const data = await res.json();
  const raw = data?.Indexers ?? data?.indexers ?? data ?? [];
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((i: { id?: string; ID?: string }) => i.id ?? i.ID)
    .filter(Boolean);
}

export async function searchJackett(query: string): Promise<TorrentSearchItem[]> {
  if (!JACKETT_API_KEY) {
    throw new Error("JACKETT_API_KEY is not set");
  }
  const indexers = await getIndexerIds();
  if (indexers.length === 0) {
    throw new Error("No Jackett indexers configured. Add indexers in Jackett UI.");
  }

  const baseUrl = JACKETT_URL.replace(/\/$/, "");
  const q = query.trim() || "";
  const searchParam = q ? `&q=${encodeURIComponent(q)}` : "";
  const results: TorrentSearchItem[] = [];

  const settled = await Promise.allSettled(
    indexers.map(async (id: string) => {
      const url = `${baseUrl}/api/v2.0/indexers/${id}/results/torznab/api?apikey=${encodeURIComponent(JACKETT_API_KEY)}&t=search${searchParam}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const xml = await res.text();
      return parseTorznabXml(xml, id);
    }),
  );

  for (const r of settled) {
    if (r.status === "fulfilled") results.push(...r.value);
  }
  results.sort((a, b) => b.pubDateMs - a.pubDateMs);
  return results;
}
