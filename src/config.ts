export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const SOCKET_SERVER_URL =
  process.env.SOCKET_SERVER_URL || "ws://localhost:3001";
export const FILE_SERVER_URL =
  process.env.FILE_SERVER_URL || "http://localhost:3002";

export const JACKETT_URL = process.env.JACKETT_URL ?? "http://localhost:9117";
export const JACKETT_API_KEY = process.env.JACKETT_API_KEY ?? "";

export const INCOMPLETE_DOWNLOADS_PATH =
  process.env.INCOMPLETE_DOWNLOADS_PATH ?? "downloads/temp";
export const POLL_INTERVAL_MS = 3000;

export const TORRENT_SORT_BY = ["date", "name", "seeds", "size"];
export const DOWNLOAD_SORT_BY = ["name", "eta", "progress", "size", "status"];
export const TORRENT_SORT_ORDER = ["asc", "desc"];
export const DOWNLOAD_SORT_ORDER = ["asc", "desc"];

export const TORRENT_DEFAULT_CATEGORIES = [
  { id: "1000", name: "Console" },
  { id: "1010", name: "Console/NDS" },
  { id: "1020", name: "Console/PSP" },
  { id: "1030", name: "Console/Wii" },
  { id: "1040", name: "Console/XBox" },
  { id: "1050", name: "Console/XBox 360" },
  { id: "1080", name: "Console/PS3" },
  { id: "1090", name: "Console/Other" },
  { id: "1110", name: "Console/3DS" },
  { id: "1180", name: "Console/PS4" },
  { id: "2000", name: "Movies" },
  { id: "2010", name: "Movies/Foreign" },
  { id: "2030", name: "Movies/SD" },
  { id: "2040", name: "Movies/HD" },
  { id: "2045", name: "Movies/UHD" },
  { id: "2060", name: "Movies/3D" },
  { id: "2070", name: "Movies/DVD" },
  { id: "3000", name: "Audio" },
  { id: "3010", name: "Audio/MP3" },
  { id: "3020", name: "Audio/Video" },
  { id: "3030", name: "Audio/Audiobook" },
  { id: "3040", name: "Audio/Lossless" },
  { id: "3050", name: "Audio/Other" },
  { id: "4000", name: "PC" },
  { id: "4030", name: "PC/Mac" },
  { id: "4040", name: "PC/Mobile-Other" },
  { id: "4050", name: "PC/Games" },
  { id: "4060", name: "PC/Mobile-iOS" },
  { id: "4070", name: "PC/Mobile-Android" },
  { id: "5000", name: "TV" },
  { id: "5030", name: "TV/SD" },
  { id: "5040", name: "TV/HD" },
  { id: "5070", name: "TV/Anime" },
  { id: "5080", name: "TV/Documentary" },
  { id: "6000", name: "XXX" },
  { id: "6010", name: "XXX/DVD" },
  { id: "6060", name: "XXX/ImageSet" },
  { id: "7000", name: "Books" },
  { id: "7020", name: "Books/EBook" },
  { id: "7030", name: "Books/Comics" },
  { id: "8000", name: "Other" },
  { id: "8010", name: "Other/Misc" },
];
