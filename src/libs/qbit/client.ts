/**
 * Minimal qBittorrent Web API client (cookie-based auth).
 * Requires QBIT_URL, QBIT_USER, QBIT_PASS in env.
 */

const QBIT_URL = process.env.QBIT_URL ?? "http://localhost:8080";
const QBIT_USER = process.env.QBIT_USER ?? "admin";
const QBIT_PASS = process.env.QBIT_PASS ?? "adminadmin";

const API_PREFIX = `${QBIT_URL.replace(/\/$/, "")}/api/v2`;

/** Raw response from qBittorrent API (snake_case). */
type QbitTorrentRaw = {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number;
  completed: number;
  save_path: string;
  content_path: string;
  added_on: number;
  completion_on: number;
  num_seeds: number;
  num_leechs: number;
  dlspeed: number;
  upspeed: number;
  eta: number;
  amount_left: number;
  magnet_uri: string;
};

export type QbitTorrent = {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number;
  completed: number;
  savePath: string;
  contentPath: string;
  addedOn: number;
  completionOn: number;
  numSeeds: number;
  numLeechs: number;
  dlSpeed: number;
  upSpeed: number;
  eta: number;
  amountLeft: number;
  magnetUri: string;
};

export type QbitTorrentFile = {
  index: number;
  name: string;
  size: number;
};

function mapQbitTorrent(raw: QbitTorrentRaw): QbitTorrent {
  return {
    hash: raw.hash,
    name: raw.name,
    state: raw.state,
    progress: raw.progress,
    size: raw.size,
    completed: raw.completed,
    savePath: raw.save_path,
    contentPath: raw.content_path,
    addedOn: raw.added_on,
    completionOn: raw.completion_on,
    numSeeds: raw.num_seeds,
    numLeechs: raw.num_leechs,
    dlSpeed: raw.dlspeed,
    upSpeed: raw.upspeed,
    eta: raw.eta,
    amountLeft: raw.amount_left,
    magnetUri: raw.magnet_uri,
  };
}

const COOKIE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Module-level cache. In Next.js: persists for process lifetime (serverful) or
// per cold start (serverless). Reduces login calls when multiple qbit requests
// occur within the TTL window.
let cookieCache: { cookie: string; expiresAt: number } | null = null;
let cookiePromise: Promise<string> | null = null;

async function getCookie(): Promise<string> {
  const now = Date.now();
  if (cookieCache && cookieCache.expiresAt > now) {
    return cookieCache.cookie;
  }
  if (cookiePromise) {
    return cookiePromise;
  }
  cookiePromise = (async () => {
    try {
      const url = `${API_PREFIX}/auth/login`;
      const body = new URLSearchParams({
        username: QBIT_USER,
        password: QBIT_PASS,
      });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: QBIT_URL,
          Origin: QBIT_URL,
        },
        body: body.toString(),
      });
      if (res.status === 403) {
        throw new Error("qBittorrent: IP banned (too many failed logins)");
      }
      if (!res.ok) {
        throw new Error(`qBittorrent login failed: ${res.status}`);
      }
      const setCookie = res.headers.get("set-cookie");
      if (!setCookie) {
        throw new Error("qBittorrent: no session cookie in login response");
      }
      const cookie = setCookie.split(";")[0].trim();
      cookieCache = { cookie, expiresAt: now + COOKIE_TTL_MS };
      return cookie;
    } finally {
      cookiePromise = null;
    }
  })();
  return cookiePromise;
}

function invalidateCookie(): void {
  cookieCache = null;
  cookiePromise = null;
}

export async function qbitRequest<T>(
  path: string,
  {
    method = "GET",
    searchParams = {},
    body,
    contentType,
    formData,
  }: {
    method?: "GET" | "POST" | "DELETE";
    searchParams?: Record<string, string>;
    body?: string;
    contentType?: string;
    formData?: FormData;
  } = {},
): Promise<T> {
  const doRequest = async (cookie: string) => {
    const url = new URL(`${API_PREFIX}${path}`);
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) =>
        url.searchParams.set(k, v),
      );
    }
    const headers: Record<string, string> = {
      Cookie: cookie,
      Referer: QBIT_URL,
      Origin: QBIT_URL,
    };
    if (contentType) headers["Content-Type"] = contentType;
    return fetch(url.toString(), { method, headers, body: formData ?? body });
  };

  let cookie = await getCookie();
  let res = await doRequest(cookie);

  if (res.status === 401 || res.status === 403) {
    invalidateCookie();
    cookie = await getCookie();
    res = await doRequest(cookie);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`qBittorrent API ${path}: ${res.status} ${text}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return undefined as T;
}

export async function listTorrents(params?: {
  filter?: string;
  sort?: string;
  reverse?: boolean;
}): Promise<QbitTorrent[]> {
  const searchParams: Record<string, string> = {};
  if (params?.filter) searchParams.filter = params.filter;
  if (params?.sort) searchParams.sort = params.sort;
  if (params?.reverse !== undefined)
    searchParams.reverse = String(params.reverse);
  const raw = await qbitRequest<QbitTorrentRaw[]>(
    "/torrents/info",
    Object.keys(searchParams).length ? { searchParams } : {},
  );
  return raw.map(mapQbitTorrent);
}

export async function addTorrent(url: string): Promise<void> {
  if (!url) {
    throw new Error("No download URL provided for this torrent");
  }
  // Pass the URL (magnet link or .torrent URL) directly to qBittorrent.
  // qBittorrent shares the same network namespace as Jackett (both behind
  // gluetun), so localhost Jackett proxy URLs resolve correctly. Jackett
  // handles the Cloudflare bypass via Byparr before returning the torrent.
  await qbitRequest("/torrents/add", {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: new URLSearchParams({ urls: url }).toString(),
  });
}

/**
 * Get the file list for a torrent by hash.
 * Returns null when qBittorrent hasn't resolved metadata yet (magnet links)
 * — callers should retry after a short delay.
 */
export async function getTorrentFiles(
  hash: string,
): Promise<QbitTorrentFile[] | null> {
  try {
    const files = await qbitRequest<QbitTorrentFile[]>("/torrents/files", {
      searchParams: { hash },
    });
    return files ?? [];
  } catch (err) {
    // 409 = metadata not yet available (newer qBittorrent versions)
    if (err instanceof Error && err.message.includes("409")) return null;
    throw err;
  }
}

export async function pauseTorrent(hash: string): Promise<void> {
  const body = new URLSearchParams({ hashes: hash }).toString();
  const opts = {
    method: "POST" as const,
    contentType: "application/x-www-form-urlencoded",
    body,
  };
  try {
    // qBittorrent 5.x renamed /pause → /stop
    await qbitRequest("/torrents/stop", opts);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      await qbitRequest("/torrents/pause", opts);
    } else {
      throw err;
    }
  }
}

export type TorrentPreview = {
  hash: string;
  files: QbitTorrentFile[];
  alreadyExists: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractMagnetHash(url: string): string | null {
  const match = url.match(/urn:btih:([a-zA-Z0-9]+)/i);
  if (!match) return null;
  const raw = match[1];
  if (raw.length === 40) return raw.toLowerCase();
  if (raw.length === 32) {
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0,
      value = 0,
      hex = "";
    for (const ch of raw.toUpperCase()) {
      const idx = alpha.indexOf(ch);
      if (idx === -1) return null;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        hex += ((value >>> (bits - 8)) & 0xff).toString(16).padStart(2, "0");
        bits -= 8;
      }
    }
    return hex;
  }
  return null;
}

/**
 * Add a torrent to qBittorrent and resolve its hash + initial file list.
 * If the torrent is already present, returns its info immediately without
 * adding a duplicate. Throws if the hash cannot be resolved after ~30 s.
 */
export async function previewTorrent(url: string): Promise<TorrentPreview> {
  const currentTorrents = await listTorrents();
  const before = new Set(currentTorrents.map((t) => t.hash.toLowerCase()));
  const magnetHash = extractMagnetHash(url);

  // Fast path: torrent already in qBittorrent (detectable via magnet hash)
  if (magnetHash && before.has(magnetHash)) {
    const files = (await getTorrentFiles(magnetHash)) ?? [];
    return { hash: magnetHash, files, alreadyExists: true };
  }

  await addTorrent(url);

  // Poll until the new entry appears (max ~30 s)
  let hash: string | null = null;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const current = await listTorrents();
    const newEntry = current.find((t) => !before.has(t.hash.toLowerCase()));
    if (newEntry) {
      hash = newEntry.hash.toLowerCase();
      break;
    }
  }

  // Slow path: no new entry found — assume duplicate, find it in the list
  if (!hash) {
    const current = await listTorrents();
    const existing = magnetHash
      ? current.find((t) => t.hash.toLowerCase() === magnetHash)
      : current
          .filter((t) => !before.has(t.hash.toLowerCase()))
          .sort((a, b) => b.addedOn - a.addedOn)[0];
    if (existing) {
      const files = (await getTorrentFiles(existing.hash)) ?? [];
      return { hash: existing.hash.toLowerCase(), files, alreadyExists: true };
    }
    throw new Error("Could not resolve torrent hash after adding");
  }

  const files = (await getTorrentFiles(hash)) ?? [];
  return { hash, files, alreadyExists: false };
}

export async function resumeTorrent(hash: string): Promise<void> {
  const body = new URLSearchParams({ hashes: hash }).toString();
  const opts = {
    method: "POST" as const,
    contentType: "application/x-www-form-urlencoded",
    body,
  };
  try {
    // qBittorrent 5.x renamed /resume → /start
    await qbitRequest("/torrents/start", opts);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      await qbitRequest("/torrents/resume", opts);
    } else {
      throw err;
    }
  }
}

export async function deleteTorrent(
  hash: string,
  deleteFiles = false,
): Promise<void> {
  const body = new URLSearchParams({
    hashes: hash,
    deleteFiles: String(deleteFiles),
  });
  await qbitRequest("/torrents/delete", {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: body.toString(),
  });
}
