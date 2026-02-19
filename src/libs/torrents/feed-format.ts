/**
 * Formatting and sorting helpers for torrent feed items (e.g. Jackett search results).
 */

export type FeedItem = {
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

export type SortBy = "date" | "seeds" | "size";

export function formatDate(isoOrRfc: string): string {
  if (!isoOrRfc) return "—";
  const d = new Date(isoOrRfc);
  const formattedDate = Intl.DateTimeFormat("en-CA", {
    dateStyle: "short",
  }).format(d);
  return formattedDate ?? isoOrRfc;
}

export function parseSizeToNum(sizeStr: string | null): number {
  if (!sizeStr) return 0;
  const m = sizeStr.match(/^([\d.]+)\s*(GB|MB|KB)?$/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  const u = (m[2] ?? "").toUpperCase();
  if (u === "GB") n *= 1024 * 1024 * 1024;
  else if (u === "MB") n *= 1024 * 1024;
  else if (u === "KB") n *= 1024;
  return n;
}

export function getAddableUrl(item: FeedItem): string | null {
  const magnet = item.magnet ?? (item.link?.startsWith("magnet:") ? item.link : null);
  if (magnet) return magnet;
  if (item.link && /\.torrent(\?|$)/i.test(item.link)) return item.link;
  return null;
}
