import { Inter, JetBrains_Mono, Press_Start_2P } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const pressStart2p = Press_Start_2P({
  weight: "400",
  style: "normal",
  subsets: ["latin"],
});
