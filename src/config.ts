export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const SOCKET_SERVER_URL =
  process.env.SOCKET_SERVER_URL || "ws://localhost:3001";
export const FILE_SERVER_URL =
  process.env.FILE_SERVER_URL || "http://localhost:3002";

export const JACKETT_URL = process.env.JACKETT_URL ?? "http://localhost:9117";
export const JACKETT_API_KEY = process.env.JACKETT_API_KEY ?? "";

export const POLL_INTERVAL_MS = 3000;
