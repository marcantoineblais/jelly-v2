import { MediaFile } from "@/src/types/MediaFile";

export default function sortMediaFiles(file1: MediaFile, file2: MediaFile) {
  const title1 = file1.mediaInfo.title || "";
  const title2 = file2.mediaInfo.title || "";
  const titleSort = title1.localeCompare(title2);

  if (titleSort !== 0) return titleSort;

  const season1 = file1.mediaInfo.season || 0;
  const season2 = file2.mediaInfo.season || 0;
  const seasonSort = season1 - season2;

  if (seasonSort !== 0) return seasonSort;

  const episode1 = file1.mediaInfo.episode || 0;
  const episode2 = file2.mediaInfo.episode || 0;
  const episodeSort = episode1 - episode2;

  return episodeSort;
}
