import { MediaInfo } from "./MediaInfo";

export interface MediaFile {
  path: string;
  name: string;
  ext: string;
  mediaInfo?: MediaInfo;
  isSelected?: boolean;
}