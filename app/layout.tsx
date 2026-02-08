import type { Metadata } from "next";
import "./globals.css";
import { roboto } from "./fonts";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  title: "Jelly",
  description: "Media files rename tool for jellyfin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
