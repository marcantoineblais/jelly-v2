import { Stats } from "fs";
import { PlatformPath } from "path";

export interface File {
  path: PlatformPath;
  stats: Stats;
}