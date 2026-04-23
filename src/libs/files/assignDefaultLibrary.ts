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

export interface LibraryAssignment {
  library: MediaLibrary;
  title?: string;
  year?: number;
}

export function assignDefaultLibrary(
  file: MediaFile,
  librariesData: { title: string; library: MediaLibrary }[] = [],
  libraries: MediaLibrary[] = [],
): LibraryAssignment {
  const normalizedFileTitle = normalizeTitle(file.mediaInfo.title ?? "");
  const existingMedia = librariesData.find(
    (data) => normalizeTitle(data.title) === normalizedFileTitle,
  );

  let defaultLibrary: MediaLibrary | undefined;
  let matchedTitle: string | undefined;
  let matchedYear: number | undefined;

  if (existingMedia) {
    defaultLibrary = existingMedia.library;
    matchedTitle = parseFolderTitle(existingMedia.title);
    matchedYear = parseFolderYear(existingMedia.title);
  } else if (file.mediaInfo.episode !== undefined) {
    const library = libraries.find((library) => library.type === "show");
    defaultLibrary = library;
  } else {
    const library = libraries.find((library) => library.type === "movie");
    defaultLibrary = library;
  }

  if (!defaultLibrary && libraries.length > 0) defaultLibrary = libraries[0];

  return {
    library: defaultLibrary ?? ({} as MediaLibrary),
    title: matchedTitle,
    year: matchedYear,
  };
}
