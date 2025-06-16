import fs from "fs";
import path from "path";

export function readConfig() {
  const cwd = process.cwd();
  const filename = "config.json";
  const dir = path.join(cwd, filename);
  const data = fs.readFileSync(dir, "utf-8");
  const config = JSON.parse(data);

  return {
    downloadPaths: config.download_paths ?? [],
    libraries: config.libraries ?? [],
    videosExt: config.videos_ext ?? [],
  };
}
