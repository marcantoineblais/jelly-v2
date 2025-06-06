import { MediaInfo } from "@/app/types/MediaInfo";

export function extractInfo(filename: string = ""): MediaInfo {
  filename = filename.replaceAll(/[_\.]/g, " "); // replace spacing symbols with actual space

  const title = extractTitle(filename);
  const year = extractYear(filename);
  const [season, episode] = extractSeries(filename);
  const type = episode ? "show" : "movie";

  return { title, year, season, episode, type };
}

function extractTitle(filename: string = "") {
  let title = filename.replace(/\-?(\-+|\s+)s\d{2}e\d{2}(\-?e\d{2})?(\-+|\s+|$).*$/i, ""); // remove everything after the episode
  title = title.replace(/\-?(\-+|\s+)\d{3,4}p(\-+|\s+|$).*$/, ""); // remove everything after the resolution
  title = title.replace(/\-?(\-+|\s+)\d{4}(\-+|\s+|$).*$/, ""); // remove everything after the year
  title = title.replace(/\-?(\-+|\s+)\d{2}(\-+|\s+|$).*$/, ""); // remove everything after episode number
  title = title.replaceAll(/\[.*\]/g, ""); // remove author and info in []
  title = title.replaceAll(/\(.*\)/g, ""); // remove author and info in ()
  
  return title.trim();
}

function extractYear(filename: string = "") {
  const match = filename.match(/(\-+|\s+|\()(\d{4})(\-+|\s+|\)|$)/);

  if (match) {
    return parseInt(match[2], 10);
  }

  return null;
}

function extractSeries(filename: string = "") {
  let seriesMatch = filename.match(/(\-+|\s+)s(\d{2})e(\d{2})(\-?e\d{2})?(\-+|\s+|$)/i);
  let season = null;
  let episode = null;

  if (seriesMatch) {
    season = parseInt(seriesMatch[2], 10);
    episode = parseInt(seriesMatch[3], 10);
  } else {
    seriesMatch = filename.match(/(\-+|\s+)(\d{2})(\-+|\s+)/);

    if (seriesMatch) {
      episode = parseInt(seriesMatch[2], 10);
    }
  }

  return [season, episode];
}