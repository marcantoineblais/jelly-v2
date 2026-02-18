"use client";

import React, { createContext, useContext } from "react";

type Config = {
  socketServerUrl: string;
  appUrl: string;
};

const ConfigContext = createContext<Config>({
  socketServerUrl: "",
  appUrl: "",
});

export function ConfigProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: Config;
}) {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
