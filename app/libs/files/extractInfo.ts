import { MediaInfo } from "@/app/types/MediaInfo";

export function extractInfo(filename: string = ""): MediaInfo {
  filename = filename.replaceAll(/[_\.]/g, " "); // replace spacing with actual space

  const title = extractTitle(filename);
  const year = extractYear(filename);
  const [season, episode] = extractSeries(filename);
  const type = episode ? "show" : "movie";

  return { title, year, season, episode, type };
}

function extractTitle(filename: string = "") {
  let title = filename.replace(/s\d{2}e\d{2}/i, ""); // remove everything after the episode
  title = title.replace(/\s*\d{3,4}p.*$/, ""); // remove everything after the resolution
  title = title.replace(/\s*\(\d{4}\).*$/, ""); // remove everything after the year
  title = title.replaceAll(/\[.*\]/g, ""); // remove author and info in []
  title = title.replaceAll(/\(.*\)/g, ""); // remove author and info in ()
  
  return title.trim();
}

function extractYear(filename: string = "") {
  const match = filename.match(/\d{4}/);

  if (match) {
    return parseInt(match[0], 10);
  }

  return null;
}

function extractSeries(filename: string = "") {
  let seriesMatch = filename.match(/s(\d{2})e(\d{2})/i);
  let season = null;
  let episode = null;

  if (seriesMatch) {
    season = parseInt(seriesMatch[1], 10);
    episode = parseInt(seriesMatch[2], 10);
  } else {
    seriesMatch = filename.match(/\d{2}(?=\s)/);

    if (seriesMatch) {
      episode = parseInt(seriesMatch[0], 10);
    }
  }

  return [season, episode];
}