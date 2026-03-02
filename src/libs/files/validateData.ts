import { MediaFile } from "@/src/types/MediaFile";

export const VALIDATION_ERROR = {
  title: "Missing title",
  season: "Missing season",
  episode: "Missing episode",
  year: "Missing year",
  library: "Missing library",
};

export function validateData(file: MediaFile) {
  const title = file.mediaInfo.title;
  const season = file.mediaInfo.season;
  const episode = file.mediaInfo.episode;
  const year = file.mediaInfo.year;
  const { type, name, path } = file.library;

  const errors = [];
  if (!title) errors.push(VALIDATION_ERROR.title);
  if (season === undefined && type === "show")
    errors.push(VALIDATION_ERROR.season);
  if (episode === undefined && type === "show")
    errors.push(VALIDATION_ERROR.episode);
  if (year === undefined && type === "movie")
    errors.push(VALIDATION_ERROR.year);
  if (!name || !path) errors.push(VALIDATION_ERROR.library);

  return errors;
}
