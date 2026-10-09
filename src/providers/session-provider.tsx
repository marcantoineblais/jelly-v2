import { ReactNode } from "react";
import { cookies } from "next/headers";
import { parsePrefs, PREFS_COOKIE_NAME } from "@/src/libs/session/prefs";
import SessionProviderClient from "./session-provider-client";

/** UI preferences, stored per browser in a cookie (see libs/session/prefs). */
export type SessionData = {
  torrents?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
  downloads?: {
    indexer?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
  trackers?: {
    selectedShowId?: string;
  };
};

export default async function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const session = parsePrefs(cookieStore.get(PREFS_COOKIE_NAME)?.value);

  return (
    <SessionProviderClient initSession={session}>
      {children}
    </SessionProviderClient>
  );
}
