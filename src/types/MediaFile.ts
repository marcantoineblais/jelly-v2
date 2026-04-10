import { MediaInfo } from "./MediaInfo";
import { MediaLibrary } from "./MediaLibrary";

export interface MediaFile {
  id: number;
  path: string;
  name: string;
  ext: string;
  size?: number;
  mediaInfo: MediaInfo;
  library: MediaLibrary;
  isSelected?: boolean;
  isIgnored?: boolean;
  errors?: string[];
}
