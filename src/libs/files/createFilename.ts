import { formatNumber } from "./formatNumber";
import type { MediaInfo } from "@/src/types/MediaInfo";

export function createFilename(info: MediaInfo = {}): string {
  const title = info.title || "Not set";
  const year = info.year ? `(${info.year})` : null;
  let se = "";
  if (info.season !== undefined || info.episode !== undefined) {
    se = " - " + createEpisodeLabel(info);
  }
  return [title, year, se].filter(Boolean).join(" ");
}

export function createEpisodeLabel(info: MediaInfo = {}): string {
  const season = info.season ?? 0;
  const episode = info.episode ?? 0;
  return `S${formatNumber(season)}E${formatNumber(episode)}`;
}
