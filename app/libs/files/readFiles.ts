import fs from "fs";
import path from "path";
import { File } from "../../entities/MediaFile";
import { searchTMDB } from "../media-lookup/tmdb";
import { extractTitle } from "./extractTitle";
import { MediaInfo } from "@/app/entities/MediaInfo";

const paths = process.env.DOWNLOAD_PATHS ?? "";
const folders = paths.split(",");
const videoExt = process.env.VIDEO_EXT ?? "";
const acceptedExt = videoExt.split(",");

export async function readFolders() {
  const files: File[] = [];

  folders.forEach((folder) => {
    extractFilesFromFolder(folder, files);
  });

  await Promise.all(
    files.map(async (file) => {
      const title = extractTitle(file.name);
      const results = await searchTMDB(title);

      file.mediaInfo = results
        .map((result: Record<string, string>) => {
          const type = result.media_type;
          if (type === "tv") {
            return {
              type: type,
              title: result.original_name,
              releaseDate: result.first_air_date,
            };
          }

          if (type === "movie") {
            return {
              type: type,
              title: result.original_title,
              releaseDate: result.release_date,
            };
          }

          return null;
        })
        .filter((info: MediaInfo) => info);
    })
  );

  return files;
}

// Recursively scan all folders and subfolders for files
function extractFilesFromFolder(
  folderPath: string = process.cwd(),
  filesList: File[] = []
) {
  const entries = fs.readdirSync(folderPath);

  entries.forEach((entry) => {
    const entryPath = path.join(folderPath, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      if (entry !== "temp") {
        extractFilesFromFolder(entryPath, filesList);
      }
    } else {
      const ext = path.extname(entry);

      if (acceptedExt.includes(ext)) {
        const file: File = {
          path: entryPath,
          name: path.basename(entry, ext),
          ext: ext,
        };

        filesList.push(file);
      }
    }
  });

  return filesList;
}
