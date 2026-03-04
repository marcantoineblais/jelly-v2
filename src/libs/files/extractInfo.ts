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

  let title = extractTitle(filename);

  // When title from filename is very short, it was likely in the parent folder name
  if (title.length < MIN_TITLE_LENGTH && parentName) {
    parentName = parentName.replaceAll(/[_\.\,]/g, " ").trim();
    title = extractTitle(parentName);
  }

  const year = extractYear(filename);
  const [season, episode] = extractSeries(filename);

  return { title, year, season, episode };
}

function extractTitle(filename: string = "") {
  let title = filename.replace(
    /\-?(\-+|\s+)s\d{2}e\d{2}(\-?e\d{2})?(\-+|\s+|$).*$/i,
    "",
  ); // remove everything after S00E00
  title = title.replaceAll(/\[.*?\]/g, ""); // remove each [...] segment (non-greedy)
  title = title.replaceAll(/\(.*?\)/g, ""); // remove each (...) segment (non-greedy)
  title = title.replace(/\-?(^|\-+|\s+)\d{3,4}p(\-+|\s+|$).*$/, ""); // remove everything after the resolution
  title = title.replace(/\-?(\-+|\s+)(19|20)\d{2}(\-+|\s+|$).*$/, ""); // remove everything after the year
  title = title.replace(/\-?(\-+|\s+)s\d{1,2}(\-+|\s+|$).*$/i, ""); // remove everything after standalone season (e.g. S01 when downloading full season)
  title = title.replace(/\-?(\-+|\s+)e[p]?\s*\d{1,3}(\-+|\s+|$).*$/i, ""); // remove everything after episode number
  title = title.replace(/\-?(\-+|\s+)\d{2}$/, ""); // remove trailing 2 digits (usually season or episode)

  return capitalize(title.trim());
}

function extractYear(filename: string = "") {
  const match = filename.match(/(\-+|\s+|\()(\d{4})(\-+|\s+|\)|$)/);

  if (match) {
    return parseInt(match[2], 10);
  }
}

function extractSeries(filename: string = "") {
  const match1 = filename.match(
    /(^|\-+|\s+)s(\d{2})e(\d{2})(\-?e\d{2})?(\-+|\s+|$)/i,
  );
  const match2 = filename.match(/(^|\-+|\s+)e[p]?\s*(\d{1,3})(\-+|\s+|$)/i);
  const match3 = filename.match(/^(\d{1,3})/);
  const match4 = filename.match(
    /(^|\-+|\s+)s(?:eason)?\s*(\d{1,2})(\-+|\s+|$)/i,
  );

  let season;
  let episode;

  if (match1) {
    season = parseInt(match1[2], 10);
    episode = parseInt(match1[3], 10);
  } else if (match2) {
    episode = parseInt(match2[2], 10);
  } else if (match3) {
    episode = parseInt(match3[1], 10);
  }

  if (season === undefined && match4) {
    season = parseInt(match4[2], 10);
  }

  return [season, episode];
}
