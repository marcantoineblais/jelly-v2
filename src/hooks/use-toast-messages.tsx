"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";

export default function ToastMessagesProvider({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider className="h-full">
      {children}
      <ToastProvider placement="bottom-center" />
    </HeroUIProvider>
  );
}
