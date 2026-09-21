import type { Metadata } from "next";
import "./globals.css";
import { jetbrainsMono } from "@/src/fonts";
import ConfigProvider from "@/src/providers/config-provider";
import SessionProvider from "@/src/providers/session-provider";
import Navigation from "../components/navigation/navigation";
import { ToastProvider } from "../providers/ToastProvider";
import { ModalProvider } from "../providers/ModalProvider";

export const metadata: Metadata = {
  title: "Jelly",
  description: "Media files manager for Jellyfin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`h-lvh w-lvh ${jetbrainsMono.className}`}>
        <ModalProvider>
          <ToastProvider>
            <ConfigProvider>
              <SessionProvider>
                <div className="h-dvh w-dvw flex flex-col overflow-hidden bg-stone-100">
                  <Navigation />
                  {children}
                </div>
              </SessionProvider>
            </ConfigProvider>
          </ToastProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
