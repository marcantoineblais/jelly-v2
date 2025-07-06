import { MediaInfo } from "./MediaInfo";
import { MediaLibrary } from "./MediaLibrary";

export interface MediaFile {
  id: number;
  path: string;
  root: string;
  name: string;
  ext: string;
  mediaInfo: MediaInfo;
  library: MediaLibrary;
  isSelected?: boolean;
  isIgnored?: boolean;
  errors?: string[];
}
