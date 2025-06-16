import { MediaInfo } from "@/app/types/MediaInfo";
import { formatNumber } from "./formatNumber";

export function createFilename(info: MediaInfo = {}): string {
  const title = info.title || "Not set";
  const year = info.year ? `(${info.year})` : null;
  const season = info.season;
  const episode = info.episode;

  let se = "";
  if (season !== null && episode !== null) {
    se = `- S${formatNumber(season)}E${formatNumber(episode)}`;
  } else if (episode !== null) {
    se = `- S00E${formatNumber(episode)}`;
  }

  return [title, year, se].filter((el) => el).join(" ");
}
