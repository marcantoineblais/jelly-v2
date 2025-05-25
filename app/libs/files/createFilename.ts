import { MediaInfo } from "@/app/types/MediaInfo";
import { formatNumber } from "./formatNumber";

export function createFilename(info: MediaInfo = {}): string {
  const title = info.title ?? "unknown";
  const year = info.year;
  const season = info.season;
  const episode = info.episode;

  let se = "";
  if (season !== undefined && episode !== undefined) {
    se = `- S${formatNumber(season)}E${formatNumber(episode)}`;
  } else if (episode !== undefined) {
    se = `- S00E${formatNumber(episode)}`;
  }

  return [title, year, se].filter((el) => el).join(" ");
}
