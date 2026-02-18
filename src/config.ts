export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "ws://localhost:3001";
export const FILE_SERVER_URL = process.env.FILE_SERVER_URL || "http://localhost:3002";

/** Torrent discovery: RSS feed URLs for /api/torrents/feed. Edit here to add or remove feeds. */
export const TORRENT_FEED_URLS: string[] = [
  "https://tpb.party/rss/top100",
  "https://www.torlock2.com/fresh/rss.xml",
  "https://www.torlock2.com/movies/rss.xml",
  "https://www.torlock2.com/television/rss.xml",
  "https://tpb.party/rss/new/201",
  "https://tpb.party/rss/new/205",
  "https://torrents.ddosecrets.org/releases.xml",
];