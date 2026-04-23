import { MediaFile } from "@/src/types/MediaFile";
import { MediaLibrary } from "@/src/types/MediaLibrary";

const FOLDER_YEAR_RE = /\s*\(((?:19|20)\d{2})\)\s*$/;

function normalizeTitle(title: string): string {
  return title.trim().replace(FOLDER_YEAR_RE, "").trim().toLowerCase();
}

function parseFolderYear(folderName: string): number | undefined {
  const match = folderName.match(FOLDER_YEAR_RE);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseFolderTitle(folderName: string): string {
  return folderName.replace(FOLDER_YEAR_RE, "").trim();
}

export function assignDefaultMediaInfo(
  file: MediaFile,
  librariesData: { title: string; library: MediaLibrary }[] = [],
  libraries: MediaLibrary[] = [],
) {
  const normalizedFileTitle = normalizeTitle(file.mediaInfo.title ?? "");
  const existingMedia = librariesData.find(
    (data) => normalizeTitle(data.title) === normalizedFileTitle,
  );

  if (existingMedia) {
    file.library = existingMedia.library;
    file.mediaInfo.title = parseFolderTitle(existingMedia.title);
    file.mediaInfo.year = parseFolderYear(existingMedia.title);
  } else if (file.mediaInfo.episode !== undefined) {
    const library = libraries.find((library) => library.type === "show");
    file.library = library ?? libraries[0];
  } else {
    const library = libraries.find((library) => library.type === "movie");
    file.library = library ?? libraries[0];
  }
}
