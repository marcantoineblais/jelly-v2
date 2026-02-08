import { MediaInfo } from "@/app/types/MediaInfo";

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
  ); // remove everything after the episode
  title = title.replace(/\-?(^|\-+|\s+)\d{3,4}p(\-+|\s+|$).*$/, ""); // remove everything after the resolution
  title = title.replace(/\-?(^|\-+|\s+)\d{4}(\-+|\s+|$).*$/, ""); // remove everything after the year
  title = title.replace(/\-?(^|e|\-+|\s+)\d{2}(\-+|\s+|$).*$/i, ""); // remove everything after episode number
  title = title.replaceAll(/\[.*\]/g, ""); // remove author and info in []
  title = title.replaceAll(/\(.*\)/g, ""); // remove author and info in ()

  return capitalize(title.trim());
}

function extractYear(filename: string = "") {
  const match = filename.match(/(\-+|\s+|\()(\d{4})(\-+|\s+|\)|$)/);

  if (match) {
    return parseInt(match[2], 10);
  }
}

function extractSeries(filename: string = "") {
  let seriesMatch = filename.match(
    /(^|\-+|\s+)s(\d{2})e(\d{2})(\-?e\d{2})?(\-+|\s+|$)/i,
  );
  let season;
  let episode;

  if (seriesMatch) {
    season = parseInt(seriesMatch[2], 10);
    episode = parseInt(seriesMatch[3], 10);
  } else {
    seriesMatch = filename.match(/(\-+|\s+)e?(\d{2})(\-+|\s+|$)/i);

    if (seriesMatch) {
      episode = parseInt(seriesMatch[2], 10);
    }
  }

  return [season, episode];
}
