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
import useFetch from "../hooks/use-fetch";
import { persistSession } from "@/src/libs/session/client";

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
  const { fetchData } = useFetch();
  const [session, setSession] = useState<SessionData>(initSession);
  
  const isFirstRender = useRef(true);
  const updateSession = useCallback((data: Partial<SessionData>) => {
    setSession((prev) => ({ ...prev, ...data }));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (Object.keys(session).length === 0) return;
    persistSession(session, fetchData);
  }, [session, fetchData]);

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
