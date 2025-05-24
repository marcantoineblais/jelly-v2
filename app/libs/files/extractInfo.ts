import { MediaInfo } from "@/app/entities/MediaInfo";

export function extractInfo(filename: string = ""): MediaInfo {
  filename = filename.replaceAll(/[_\.]/g, " "); // replace spacing with actual space

  let title = filename.replace(/[sS]\d{2}[eE]\d{2}/, ""); // remove everything after the episode
  title = title.replace(/\s*\d{3,4}p.*$/, ""); // remove everything after the resolution
  title = title.replace(/\s*\(\d{4}\).*$/, ""); // remove everything after the year
  title = title.replaceAll(/\[.*\]/g, ""); // remove author and info in []
  title = title.replaceAll(/\(.*\)/g, ""); // remove author and info in ()
  title = title.trim();

  const yearMatch = filename.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : null;

  let episodeMatch = filename.match(/[sS]\d{2}[eE]\d{2}/);
  let episode = episodeMatch ? episodeMatch[0].toUpperCase() : null;

  if (!episode) {
    episodeMatch = filename.match(/\d{2}(?=\s)/);
    episode = episodeMatch ? `S01E${episodeMatch[0]}` : null;
  }

  const type = episode ? "show" : "movie";

  return { title, year, episode, type };
}
