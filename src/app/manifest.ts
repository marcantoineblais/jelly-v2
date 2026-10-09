import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jelly",
    short_name: "Jelly",
    description: "Media files manager for Jellyfin",
    start_url: "/",
    display: "standalone",
    background_color: "#090d0c",
    theme_color: "#090d0c",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
