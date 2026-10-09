import type { SessionData } from "@/src/providers/session-provider";
import { PREFS_COOKIE_NAME, PREFS_MAX_AGE_S } from "./prefs";

/** Saves the preferences in the browser's cookie (no network request). */
export function writePrefsCookie(prefs: SessionData): void {
  const value = encodeURIComponent(JSON.stringify(prefs));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PREFS_COOKIE_NAME}=${value}; Path=/; Max-Age=${PREFS_MAX_AGE_S}; SameSite=Lax${secure}`;
}
