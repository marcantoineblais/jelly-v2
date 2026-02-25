import { readdir } from "fs/promises";
import { join } from "path";
import { readConfig } from "@/src/libs/readConfig";
import type { MediaLibrary } from "@/src/types/MediaLibrary";

export type NextEpisode = {
  season: number;
  episode: number;
  query: string;
};

const SEASON_FOLDER_RE = /^Season\s+(\d+)$/i;
const EPISODE_RE = /S(\d{2})E(\d{2})/i;

export function getShowLibraries(): MediaLibrary[] {
  const config = readConfig();
  return config.libraries.filter((lib) => lib.type === "show");
}

export function findLibraryByName(name: string): MediaLibrary | undefined {
  return getShowLibraries().find((lib) => lib.name === name);
}

export async function listShowFolders(
  libraryPath: string,
): Promise<string[]> {
  try {
    const entries = await readdir(libraryPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch {
    return [];
  }
}

export async function getNextEpisode(
  title: string,
  libraryPath: string,
): Promise<NextEpisode> {
  const showDir = join(libraryPath, title);

  let seasonDirs: { name: string; num: number }[];
  try {
    const entries = await readdir(showDir, { withFileTypes: true });
    seasonDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => {
        const match = e.name.match(SEASON_FOLDER_RE);
        return match ? { name: e.name, num: parseInt(match[1], 10) } : null;
      })
      .filter((s): s is { name: string; num: number } => s !== null && s.num > 0)
      .sort((a, b) => a.num - b.num);
  } catch {
    return { season: 1, episode: 1, query: formatSearchQuery(title, 1, 1) };
  }

  if (seasonDirs.length === 0) {
    return { season: 1, episode: 1, query: formatSearchQuery(title, 1, 1) };
  }

  const latestSeason = seasonDirs[seasonDirs.length - 1];
  const seasonPath = join(showDir, latestSeason.name);
  const highestEp = await findHighestEpisode(seasonPath);

  const nextEp = highestEp + 1;
  return {
    season: latestSeason.num,
    episode: nextEp,
    query: formatSearchQuery(title, latestSeason.num, nextEp),
  };
}

async function findHighestEpisode(seasonPath: string): Promise<number> {
  try {
    const entries = await readdir(seasonPath);
    let highest = 0;
    for (const name of entries) {
      const match = name.match(EPISODE_RE);
      if (match) {
        const ep = parseInt(match[2], 10);
        if (ep > highest) highest = ep;
      }
    }
    return highest;
  } catch {
    return 0;
  }
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatSearchQuery(
  title: string,
  season: number,
  episode: number,
): string {
  return `${title} S${pad2(season)}E${pad2(episode)}`;
}
