import { MediaFile } from "./MediaFile";

export class SortedMedia {
  shows: { [key: string]: Record<string, MediaFile[]> } = {};
  movies: MediaFile[] = [];
  unknown: MediaFile[] = [];

  constructor(files: MediaFile[] = []) {
    files.forEach((file) => {
      if (!file.mediaInfo) {
        this.unknown.push(file);
      } else if (file.mediaInfo.type === "movie") {
        this.movies.push(file);
      } else {
        const title = file.mediaInfo.title || "Not set";
        const season = file.mediaInfo.season ?? "Not set";

        if (!this.shows[title]) {
          this.shows[title] = {};
        }

        if (!this.shows[title][season]) {
          this.shows[title][season] = [];
        }

        this.shows[title][season].push(file);
      }
    });
  }
}
