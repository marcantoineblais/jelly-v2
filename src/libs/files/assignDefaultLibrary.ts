import { MediaFile } from "@/src/types/MediaFile";
import { MediaLibrary } from "@/src/types/MediaLibrary";

export function assignDefaultLibrary(
  file: MediaFile,
  librariesData: { title: string; library: MediaLibrary }[] = [],
  libraries: MediaLibrary[] = [],
) {
  const existingMedia = librariesData.find(
    (data) => data.title.toLowerCase() === file.mediaInfo.title?.toLowerCase(),
  );

  let defaultLibrary: MediaLibrary | undefined;
  if (existingMedia) {
    defaultLibrary = existingMedia.library;
  } else if (file.mediaInfo.episode !== undefined) {
    const library = libraries.find((library) => library.type === "show");
    defaultLibrary = library;
  } else {
    const library = libraries.find((library) => library.type === "movie");
    defaultLibrary = library;
  }

  if (!defaultLibrary && libraries.length > 0) defaultLibrary = libraries[0];

  return defaultLibrary ?? {};
}
