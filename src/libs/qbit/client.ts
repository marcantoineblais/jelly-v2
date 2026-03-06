/**
 * Minimal qBittorrent Web API client (cookie-based auth).
 * Requires QBIT_URL, QBIT_USER, QBIT_PASS in env.
 */

import { JACKETT_URL } from "@/src/config";

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

/**
 * Rewrite localhost/127.0.0.1 in Jackett-generated download URLs to the
 * configured JACKETT_URL host so the jelly server can reach them.
 */
function rewriteJackettHost(url: string): string {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    ) {
      const jackettBase = new URL(JACKETT_URL.replace(/\/$/, ""));
      parsed.hostname = jackettBase.hostname;
      parsed.port = jackettBase.port;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function fetchTorrentBytes(downloadUrl: string): Promise<ArrayBuffer> {
  const torrentRes = await fetch(downloadUrl);
  if (!torrentRes.ok) {
    throw new Error(
      `Failed to fetch torrent file: ${torrentRes.status} ${torrentRes.statusText}`,
    );
  }

  const contentType = torrentRes.headers.get("content-type") ?? "";
  const arrayBuffer = await torrentRes.arrayBuffer();

  // Cloudflare challenge pages are returned as HTML with HTTP 200.
  // Detect them by content-type or by checking the first byte for 'd' (0x64),
  // the bencoding dictionary marker that all valid .torrent files start with.
  const isHtml =
    contentType.includes("text/html") || contentType.includes("text/plain");
  const startsWithBencode = new Uint8Array(arrayBuffer)[0] === 0x64;
  if (isHtml || !startsWithBencode) {
    throw new Error(
      `Torrent fetch returned non-torrent content (possible Cloudflare block). Content-Type: ${contentType || "unknown"}`,
    );
  }

  return arrayBuffer;
}

export async function addTorrent(url: string): Promise<void> {
  // Magnet links are passed directly; qBittorrent handles them natively.
  if (url.startsWith("magnet:")) {
    await qbitRequest("/torrents/add", {
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      body: new URLSearchParams({ urls: url }).toString(),
    });
    return;
  }

  // For .torrent URLs (including Cloudflare-protected trackers like YGG),
  // download the file server-side through Jackett's proxy → Byparr (Cloudflare
  // solver), then upload the raw bytes to qBittorrent. Retry once on failure
  // since Cloudflare solvers are probabilistic.
  const downloadUrl = rewriteJackettHost(url);
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const arrayBuffer = await fetchTorrentBytes(downloadUrl);
      const blob = new Blob([arrayBuffer], { type: "application/x-bittorrent" });
      const formData = new FormData();
      formData.append("torrents", blob, "torrent.torrent");
      await qbitRequest("/torrents/add", { method: "POST", formData });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) {
        // Brief pause before retry so the solver can refresh its session.
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
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
