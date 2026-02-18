import { MediaFile } from "@/app/types/MediaFile";
import { MediaLibrary } from "@/app/types/MediaLibrary";
import { SortedMedia } from "@/app/types/SortedMedia";
import sortMediaFiles from "./sortMediaFiles";

export function sortFilesByLibrary(
  files: MediaFile[],
  libraries: MediaLibrary[],
  binned: boolean = false,
): SortedMedia {
  const names: string[] = libraries
    .map((library) => library.name)
    .filter((name) => typeof name === "string");

  const sorted: SortedMedia = {};

  names.forEach((name) => {
    const content = files
      .filter(
        (file) =>
          (file.isIgnored ?? false) === binned && file.library.name === name,
      )
      .sort(sortMediaFiles);

    sorted[name] = content;
  });

  Object.entries(sorted).forEach(([key, value]) => {
    if (value.length === 0) {
      delete sorted[key];
    }
  });

  return sorted;
}
