import Parser from "rss-parser";

export type FeedTorrentItem = {
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

const MAGNET_REGEX = /magnet:\?[^\s"']+/i;
const SIZE_REGEX = /(\d+(?:\.\d+)?\s*(?:GB|MB|GiB|MiB|TB|TiB))/i;
const SEEDS_REGEX = /(?:seed|seeds)[:\s]*(\d+)/i;
const LEECH_REGEX = /(?:leech|leeches)[:\s]*(\d+)/i;

function extractMagnet(link: string | undefined, content: string): string | null {
  if (link?.startsWith("magnet:")) return link;
  const inContent = content && MAGNET_REGEX.exec(content);
  return inContent ? inContent[0] : null;
}

function extractSize(text: string): string | null {
  const m = text && SIZE_REGEX.exec(text);
  return m ? m[1] : null;
}

function extractSeeds(text: string): number | null {
  const m = text && SEEDS_REGEX.exec(text);
  return m ? parseInt(m[1], 10) : null;
}

function extractLeech(text: string): number | null {
  const m = text && LEECH_REGEX.exec(text);
  return m ? parseInt(m[1], 10) : null;
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; JellyTorrent/1.0; +https://github.com/marcantoineblais/jelly)",
  },
});

export async function parseFeed(
  feedUrl: string,
  sourceLabel?: string,
): Promise<FeedTorrentItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const source = sourceLabel ?? feed.title ?? feedUrl;
  const text = (item: { content?: string; contentSnippet?: string; link?: string }) =>
    [item.content, item.contentSnippet, item.link].filter(Boolean).join(" ");

  return (feed.items ?? []).map((item) => {
    const content = text(item);
    const link = item.link ?? "";
    const magnet = extractMagnet(link, content);
    const pubDate = item.pubDate ?? "";
    const pubDateMs = pubDate ? new Date(pubDate).getTime() : 0;

    return {
      title: item.title ?? "",
      link,
      magnet,
      pubDate,
      pubDateMs,
      size: extractSize(content),
      seeds: extractSeeds(content),
      leech: extractLeech(content),
      source,
    };
  });
}

export async function parseFeeds(feedUrls: string[]): Promise<FeedTorrentItem[]> {
  const results = await Promise.allSettled(
    feedUrls.map((url, i) => parseFeed(url, `Feed ${i + 1}`)),
  );
  const all: FeedTorrentItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    }
    // on rejected we skip that feed (could log in dev)
  }
  all.sort((a, b) => b.pubDateMs - a.pubDateMs);
  return all;
}

export function getDefaultFeedUrls(): string[] {
  const env = process.env.TORRENT_FEED_URLS;
  if (!env || typeof env !== "string") return [];
  return env
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}
