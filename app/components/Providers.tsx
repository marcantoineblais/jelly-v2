"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-full flex flex-col">
      <div className="h-full flex-1 min-h-0 flex flex-col">
        <HeroUIProvider className="h-full">
          {children}
          <ToastProvider />
        </HeroUIProvider>
      </div>
    </div>
  );
}
