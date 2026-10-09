import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, jetbrainsMono } from "@/src/fonts";
import ConfigProvider from "@/src/providers/config-provider";
import SessionProvider from "@/src/providers/session-provider";
import Navigation, { MobileTabBar } from "../components/navigation/navigation";
import { ToastProvider } from "../providers/ToastProvider";
import { ModalProvider } from "../providers/ModalProvider";

export const metadata: Metadata = {
  title: "Jelly",
  description: "Media files manager for Jellyfin",
};

export const viewport: Viewport = {
  themeColor: "#090d0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`h-lvh w-lvh font-sans ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <ModalProvider>
          <ToastProvider>
            <ConfigProvider>
              <SessionProvider>
                <div className="app-backdrop h-dvh w-dvw flex flex-col overflow-hidden text-text">
                  <Navigation />
                  <div className="flex-1 min-h-0 flex flex-col">{children}</div>
                  <MobileTabBar />
                </div>
              </SessionProvider>
            </ConfigProvider>
          </ToastProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
