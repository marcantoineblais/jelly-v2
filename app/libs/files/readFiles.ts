import fs from "fs";
import path from "path";
import { MediaFile } from "../../types/MediaFile";
import { extractInfo } from "./extractInfo";

const paths = process.env.DOWNLOAD_PATHS ?? "";
const folders = paths.split(",");
const videoExt = process.env.VIDEO_EXT ?? "";
const acceptedExt = videoExt.split(",");

export async function readFolders() {
  const files: MediaFile[] = [];

  folders.forEach((folder) => {
    extractFilesFromFolder(folder, files);
  });

  files.forEach((file) => {
    file.mediaInfo = extractInfo(file.name);
  });
  console.log(files);
  
  return files;
}

// Recursively scan all folders and subfolders for files
function extractFilesFromFolder(
  folderPath: string = process.cwd(),
  filesList: MediaFile[] = []
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
        const file: MediaFile = {
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
