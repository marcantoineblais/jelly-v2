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
