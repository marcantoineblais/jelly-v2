import { MediaInfo } from "@/src/types/MediaInfo";
import path from "path";

const MIN_TITLE_LENGTH = 4;
const NON_CAPITALIZED_WORDS = [
  "a",
  "an",
  "the",
  "at",
  "by",
  "for",
  "in",
  "of",
  "on",
  "to",
  "up",
  "and",
  "but",
  "or",
  "nor",
  "so",
  "yet",
];

const SERIES_PATTERNS = [
  // S01E05
  {
    regex: /(^|\-+|\s+)s(\d{2})e(\d{2,3})(?=\D|$)/i,
    seasonGroup: 2,
    episodeGroup: 3,
  },
  // E05, EP05, EP 05
  { regex: /(^|\-+|\s+)e[p]?\s*(\d{2,3})(\-+|\s+|$)/i, episodeGroup: 2 },
  // Non-standard: 1-2 digit season + 1-3 digit episode (e.g. "Show Name 2 05")
  {
    regex: /(\-+|\s+)(\d{1,2})(\-+|\s+)(\d{1,3})(\-+|\s+|$)/,
    seasonGroup: 2,
    episodeGroup: 4,
  },
  // Trailing digits (episode only)
  { regex: /(\d{1,3})$/, episodeGroup: 1 },
  // First digit group
  { regex: /(?<!\d)\d{1,3}(?!\d)/, episodeGroup: 1 },
];

const SEASON_PATTERN = /(^|\-+|\s+)s(?:eason)?\s*(\d{1,2})(\-+|\s+|$)/i;
const WHITE_SPACE_PATTERN = /[._]/g;

function capitalize(str = "") {
  const words = str.split(/(\s|\-)/);
  const capitalizedList = words.map((word, i) => {
    if (i === 0 || !NON_CAPITALIZED_WORDS.includes(word)) {
      const firstLetter = word.slice(0, 1).toUpperCase();
      const restOfWord = word.slice(1).toLowerCase();
      return firstLetter + restOfWord;
    }

    return word.toLowerCase();
  });

  return capitalizedList.join("");
}

export function extractInfo(
  filePath: string = "",
  rootDir: string = "",
): MediaInfo {
  const normalizedPath = path.normalize(filePath);
  const normalizedRoot = path.normalize(rootDir || "");
  const relativePath = normalizedRoot
    ? path.relative(normalizedRoot, normalizedPath)
    : normalizedPath;
  const safePath = relativePath || path.basename(normalizedPath);
  const foldersArray = safePath.split(path.sep).filter(Boolean);
  const mainFolder = (foldersArray[0] ?? "").replaceAll(
    WHITE_SPACE_PATTERN,
    " ",
  );
  const seasonFolder = foldersArray[foldersArray.length - 2]?.replaceAll(
    WHITE_SPACE_PATTERN,
    " ",
  );
  const filenameWithExt =
    foldersArray[foldersArray.length - 1] ?? path.basename(normalizedPath);
  const ext = path.extname(filenameWithExt);
  const basename = path.basename(filenameWithExt, ext);
  const filename = (basename || path.basename(filenameWithExt))
    .replaceAll(WHITE_SPACE_PATTERN, " ")
    .trim();

  const hasMainFolder = foldersArray.length > 1;
  const hasSeasonFolder = foldersArray.length > 1;

  let [season, episode, matcher] = extractSeries(filename);
  let title = extractTitle(filename, matcher);
  let year = extractYear(filename);

  if (!episode && hasMainFolder) {
    [season, episode, matcher] = extractSeries(mainFolder);
  }

  if (title.length < MIN_TITLE_LENGTH && hasMainFolder) {
    title = extractTitle(mainFolder, matcher);
  }

  if (!season && hasSeasonFolder) {
    const match = seasonFolder.match(SEASON_PATTERN);
    if (match) season = parseInt(match[2]);
  }

  if (!year && hasMainFolder) {
    year = extractYear(mainFolder);
  }

  return { title, year, season, episode };
}

function extractTitle(filename: string = "", matcher?: RegExp) {
  const regex = matcher ? new RegExp(matcher.source + ".*", "i") : "";
  const title = filename
    .replaceAll(/\[.*?\]/g, "") // remove each [...] segment (non-greedy)
    .replaceAll(/\(.*?\)/g, "") // remove each (...) segment (non-greedy)
    .replace(regex, "") // remove the season and episode infos using the matcher
    .replace(/\-?(^|\-+|\s+)\d{3,4}p(\-+|\s+|$).*$/, "") // remove everything after the resolution
    .replace(/\-?(\-+|\s+)(19|20)\d{2}(\-+|\s+|$).*$/, "") // remove everything after the year
    .replace(/[\s\-]+$/, ""); // remove trailing spaces and dashes

  return capitalize(title.trim());
}

function extractYear(filename: string = "") {
  const match = filename.match(/(\-+|\s+|\()(\d{4})(\-+|\s+|\)|$)/);

  if (match) {
    return parseInt(match[2], 10);
  }
}

function extractSeries(
  filename: string = "",
): [number | undefined, number | undefined, RegExp | undefined] {
  let season;
  let episode;
  let matchedPattern;

  const formatedTitle = filename
    .replaceAll(/\[.*?\]/g, "") // remove each [...] segment (non-greedy)
    .replaceAll(/\(.*?\)/g, ""); // remove each (...) segment (non-greedy)

  for (const pattern of SERIES_PATTERNS) {
    const match = formatedTitle.match(pattern.regex);
    if (match) {
      if (pattern.seasonGroup) {
        season = parseInt(match[pattern.seasonGroup], 10);
      }
      if (pattern.episodeGroup) {
        episode = parseInt(match[pattern.episodeGroup], 10);
      }
      matchedPattern = pattern.regex;
      break;
    }
  }

  return [season, episode, matchedPattern];
}
