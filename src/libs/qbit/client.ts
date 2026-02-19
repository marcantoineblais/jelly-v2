/**
 * Minimal qBittorrent Web API client (cookie-based auth).
 * Requires QBIT_URL, QBIT_USER, QBIT_PASS in env.
 */

const QBIT_URL = process.env.QBIT_URL ?? "http://localhost:8080";
const QBIT_USER = process.env.QBIT_USER ?? "admin";
const QBIT_PASS = process.env.QBIT_PASS ?? "adminadmin";

const API_PREFIX = `${QBIT_URL.replace(/\/$/, "")}/api/v2`;

export type QbitTorrent = {
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

async function getCookie(): Promise<string> {
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
  return setCookie.split(";")[0].trim();
}

export async function qbitRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    searchParams?: Record<string, string>;
    body?: string;
    contentType?: string;
  } = {},
): Promise<T> {
  const cookie = await getCookie();
  const url = new URL(`${API_PREFIX}${path}`);
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([k, v]) =>
      url.searchParams.set(k, v),
    );
  }
  const headers: Record<string, string> = {
    Cookie: cookie,
    Referer: QBIT_URL,
    Origin: QBIT_URL,
  };
  if (options.contentType) headers["Content-Type"] = options.contentType;
  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body,
  });
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
  return qbitRequest<QbitTorrent[]>(
    "/torrents/info",
    Object.keys(searchParams).length ? { searchParams } : {},
  );
}

export async function addTorrent(magnetOrUrl: string): Promise<void> {
  const body = new URLSearchParams({ urls: magnetOrUrl });
  await qbitRequest("/torrents/add", {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: body.toString(),
  });
}

export async function deleteTorrent(hash: string, deleteFiles = false): Promise<void> {
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
