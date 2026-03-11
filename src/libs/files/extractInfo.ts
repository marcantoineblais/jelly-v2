import { MediaInfo } from "@/src/types/MediaInfo";

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
  { regex: /(^|\-+|\s+)s(\d{2})e(\d{2,3})(\-+|\s+|$)/i, seasonGroup: 2, episodeGroup: 3 },
  // E05, EP05, EP 05
  { regex: /(^|\-+|\s+)e[p]?\s*(\d{2,3})(\-+|\s+|$)/i, episodeGroup: 2 },
  // Non-standard: 1-2 digit season + 1-3 digit episode (e.g. "Show Name 2 05")
  { regex: /(\-+|\s+)(\d{1,2})(\-+|\s+)(\d{1,3})(\-+|\s+|$)/, seasonGroup: 2, episodeGroup: 4 },
  // Leading digits (episode only)
  { regex: /^(\d{1,3})/, episodeGroup: 1 },
  // Trailing digits (episode only)
  { regex: /(\d{1,3})$/, episodeGroup: 1 },
];

const SEASON_PATTERN = /(^|\-+|\s+)s(?:eason)?\s*(\d{1,2})(\-+|\s+|$)/i;

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
  filename: string = "",
  parentName: string = "",
): MediaInfo {
  filename = filename.replaceAll(/[_\.\,]/g, " "); // replace spacing symbols with actual space

  const year = extractYear(filename);
  const [season, episode, seriesPattern] = extractSeries(filename);

  let title = extractTitle(filename, seriesPattern);

  // When title from filename is very short, it was likely in the parent folder name
  if (title.length < MIN_TITLE_LENGTH && parentName) {
    parentName = parentName.replaceAll(/[_\.\,]/g, " ").trim();
    title = extractTitle(parentName, seriesPattern);
  }

  return { title, year, season, episode };
}

function extractTitle(filename: string = "", seriesPattern?: RegExp) {
  let title = filename;

  // Remove series info using the same pattern that matched
  if (seriesPattern) {
    title = title.replace(seriesPattern, " ");
  }

  title = title.replaceAll(/\[.*?\]/g, ""); // remove each [...] segment (non-greedy)
  title = title.replaceAll(/\(.*?\)/g, ""); // remove each (...) segment (non-greedy)
  title = title.replace(/\-?(^|\-+|\s+)\d{3,4}p(\-+|\s+|$).*$/, ""); // remove everything after the resolution
  title = title.replace(/\-?(\-+|\s+)(19|20)\d{2}(\-+|\s+|$).*$/, ""); // remove everything after the year

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

  for (const pattern of SERIES_PATTERNS) {
    const match = filename.match(pattern.regex);
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

  if (season === undefined) {
    const match = filename.match(SEASON_PATTERN);
    if (match) {
      season = parseInt(match[2], 10);
    }
  }

  return [season, episode, matchedPattern];
}
