import { MediaFile } from "@/app/types/MediaFile";
import { MediaLibrary } from "@/app/types/MediaLibrary";

export function assignDefaultLibrary(
  file: MediaFile,
  librariesData: { title: string; library: MediaLibrary }[] = [],
  libraries: MediaLibrary[] = []
) {
  const existingMedia = librariesData.find(
    (data) =>
      data.title.toLowerCase() === file.mediaInfo.title?.toLowerCase()
  );

  let defaultLibrary: MediaLibrary;
  if (existingMedia) {
    defaultLibrary = existingMedia.library;
  } else if (file.mediaInfo.episode !== null) {
    const library = libraries.find(library => library.type === "show");
    defaultLibrary = library ?? {};
  } else {
    const library = libraries.find(library => library.type === "movie");
    defaultLibrary = library ?? {};
  }
  
  return defaultLibrary;
}
