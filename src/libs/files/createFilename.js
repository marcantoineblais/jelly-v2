import { formatNumber } from "./formatNumber.js";

export function createFilename(info = {}) {
  const title = info.title || "Not set";
  const year = info.year ? `(${info.year})` : null;
  let se = ""; 
  if (info.mediaType === "show") {
    se = " - " + createEpisodeLabel(info);
  }

  return [title, year, se].filter((el) => el).join(" ");
}

export function createEpisodeLabel(info = {}) {
  const season = info.season ?? 0;
  const episode = info.episode ?? 0;

  return `S${formatNumber(season)}E${formatNumber(episode)}`;
}
