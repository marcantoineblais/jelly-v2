import type { SessionData } from "@/src/providers/session-provider";

/**
 * UI preferences (sorts, filters, selected tracker) live in a cookie: they
 * are per browser, cost no request when changed, and the server can read
 * them while rendering so pages arrive with the right values.
 */
export const PREFS_COOKIE_NAME = "jelly-prefs";
export const PREFS_MAX_AGE_S = 60 * 60 * 24 * 365;

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/** Reads the cookie value, tolerating both raw and URI-encoded JSON. */
export function parsePrefs(raw: string | undefined): SessionData {
  if (!raw) return {};
  let data = parseJson(raw);
  if (data === undefined) {
    try {
      data = parseJson(decodeURIComponent(raw));
    } catch {
      return {};
    }
  }
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as SessionData)
    : {};
}
