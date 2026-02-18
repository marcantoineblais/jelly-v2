import { formatNumber } from "./formatNumber.js";

export function createFilename(info = {}) {
  const title = info.title || "Not set";
  const year = info.year ? `(${info.year})` : null;
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
