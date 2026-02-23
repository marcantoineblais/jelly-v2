import type { Metadata } from "next";
import "./globals.css";
import { jetbrainsMono } from "@/src/fonts";
import ToastMessagesProvider from "@/src/hooks/use-toast-messages";
import ConfigProvider from "@/src/providers/config-provider";
import SessionProvider from "@/src/providers/session-provider";
import Navigation from "../components/ui/navigation";

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
        <ConfigProvider>
          <SessionProvider>
            <ToastMessagesProvider>
              <div className="h-dvh w-dvw flex flex-col overflow-hidden">
                <Navigation />
                {children}
              </div>
            </ToastMessagesProvider>
          </SessionProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
