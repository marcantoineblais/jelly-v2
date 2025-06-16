import { MediaLibrary } from "./MediaLibrary";

export interface ConfigFile {
  downloadPaths: string[];
  libraries: MediaLibrary[];
  videosExt: string[];
}