import type { Metadata } from "next";
import { Press_Start_2P, Roboto } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jelly",
  description: "Media files rename tool for jellyfin",
};

export const roboto = Roboto({
  weight: "400",
  subsets: ["latin"],
});

export const pressStart2p = Press_Start_2P({
  weight: "400",
  style: "normal",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className}`}>{children}</body>
    </html>
  );
}
