import type { Metadata } from "next";
import "./globals.css";
import { roboto } from "./fonts";
import ToastMessagesProvider from "./hooks/use-toast-messages";
import { APP_URL, FILE_SERVER_URL, SOCKET_SERVER_URL } from "./config";
import { ConfigProvider } from "./hooks/use-config";

export const metadata: Metadata = {
  title: "Jelly",
  description: "Media files rename tool for jellyfin",
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
      <body className={`${roboto.className}`}>
        <ConfigProvider config={config}>
          <ToastMessagesProvider>{children}</ToastMessagesProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
