import type { Metadata } from "next";
import "./globals.css";
import { roboto } from "@/src/fonts";
import ToastMessagesProvider from "@/src/hooks/use-toast-messages";
import { APP_URL, FILE_SERVER_URL, SOCKET_SERVER_URL } from "@/src/config";
import { ConfigProvider } from "@/src/hooks/use-config";
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
  const config = {
    socketServerUrl: SOCKET_SERVER_URL,
    appUrl: APP_URL,
    fileServerUrl: FILE_SERVER_URL,
  };

  return (
    <html lang="en">
      <body className={`h-lvh w-lvh ${roboto.className}`}>
        <ConfigProvider config={config}>
          <ToastMessagesProvider>
            <div className="h-dvh w-dvw flex flex-col overflow-hidden">
              <Navigation />
              {children}
            </div>
          </ToastMessagesProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
