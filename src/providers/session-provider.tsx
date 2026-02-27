import { ReactNode } from "react";
import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@/src/config";
import { getCurrentUser } from "@/src/libs/auth/login";
import { readSession } from "@/src/libs/session/storage";
import SessionProviderClient from "./session-provider-client";

export type SessionData = {
  torrents?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
};

export default async function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const username = await getCurrentUser(token);

  let session: SessionData | null = null;
  if (username) {
    session = await readSession(username);
  }

  return (
    <SessionProviderClient initSession={session ?? {}}>
      {children}
    </SessionProviderClient>
  );
}
