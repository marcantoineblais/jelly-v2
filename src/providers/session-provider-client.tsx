"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SessionData } from "./session-provider";
import { writePrefsCookie } from "@/src/libs/session/client";

type SessionContextValue = {
  session: SessionData;
  updateSession: (data: Partial<SessionData>) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export default function SessionProviderClient({
  children,
  initSession = {},
}: {
  children: React.ReactNode;
  initSession?: SessionData;
}) {
  const [session, setSession] = useState<SessionData>(initSession);

  const updateSession = useCallback((data: Partial<SessionData>) => {
    setSession((prev) => ({ ...prev, ...data }));
  }, []);

  // Writing a cookie is local to the browser, so it can happen on every change
  const lastSavedRef = useRef(JSON.stringify(initSession));
  useEffect(() => {
    const serialized = JSON.stringify(session);
    if (serialized === lastSavedRef.current) return;
    lastSavedRef.current = serialized;
    writePrefsCookie(session);
  }, [session]);

  const value: SessionContextValue = { session, updateSession };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
