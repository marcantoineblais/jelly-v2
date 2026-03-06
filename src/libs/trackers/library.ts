import { readdirSync } from "fs";
import { join } from "path";
import { readConfig } from "@/src/libs/readConfig";
import type { MediaLibrary } from "@/src/types/MediaLibrary";
import { formatSeasonPath, LastEpisode } from "./library-utils";

const EPISODE_RE = /S(\d{2})E(\d{2})/i;

export function getShowLibraries(): MediaLibrary[] {
  const config = readConfig();
  return config.libraries.filter((lib) => lib.type === "show");
}

export function findLibraryByName(name: string): MediaLibrary | undefined {
  return getShowLibraries().find((lib) => lib.name === name);
}

export async function listShowFolders(libraryPath: string): Promise<string[]> {
  try {
    const entries = readdirSync(libraryPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch {
    return [];
  }
}

export async function getLastEpisode(
  title: string,
  libraryPath: string,
  season: number,
): Promise<LastEpisode> {
  const showDir = join(libraryPath, title);
  const seasonPath = join(showDir, formatSeasonPath(season));
  const lastEpisode = await findHighestEpisode(seasonPath);
  return {
    season,
    episode: lastEpisode,
  };
}

async function findHighestEpisode(seasonPath: string): Promise<number> {
  try {
    let highest = 0;
    for (const entry of readdirSync(seasonPath)) {
      const match = entry.match(EPISODE_RE);
      if (!match) continue;
      const episode = parseInt(match[2], 10);
      if (!isNaN(episode) && episode > highest) highest = episode;
    }
    return highest;
  } catch {
    return 0;
  }
}
