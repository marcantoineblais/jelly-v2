/**
 * Formatting and sorting helpers for torrent feed items (e.g. Jackett search results).
 */

export type FeedItem = {
  id: number;
  title: string;
  url: string;
  pubDate: string;
  pubDateMs: number;
  size: string | null;
  seeds: number | null;
  leech: number | null;
  source: string;
};

export type SortBy = "date" | "seeds" | "size" | "name";

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

export function sortFeedItems<
  T extends {
    pubDateMs: number;
    seeds: number | null;
    size: string | null;
    title: string;
  },
>(items: T[], sortBy: SortBy, sortOrder: "asc" | "desc"): T[] {
  const dir = sortOrder === "asc" ? 1 : -1;
  switch (sortBy) {
    case "date":
      return [...items].sort(
        (a, b) => ((a.pubDateMs ?? 0) - (b.pubDateMs ?? 0)) * dir,
      );
    case "name":
      return [...items].sort((a, b) => a.title.localeCompare(b.title) * dir);
    case "seeds":
      return [...items].sort((a, b) => ((a.seeds ?? 0) - (b.seeds ?? 0)) * dir);
    case "size":
      return [...items].sort(
        (a, b) => (parseSizeToNum(a.size) - parseSizeToNum(b.size)) * dir,
      );
  }
}
