import fs from "fs";
import path from "path";
import { MediaFile } from "../../types/MediaFile";
import { extractInfo } from "./extractInfo";
import { assignDefaultLibrary } from "./assignDefaultLibrary";
import { MediaLibrary } from "@/app/types/MediaLibrary";

export function readFolders(
  folders: string[],
  videoExt: string[],
  libraries: MediaLibrary[],
) {
  const files: MediaFile[] = [];
  let idCounter = 1;
  const librariesData: { title: string; library: MediaLibrary }[] = [];
  libraries.forEach((library) => {
    if (library.type === "show" && library.path) {
      const files = readLibraryFiles(library.path);
      files.forEach((file) =>
        librariesData.push({ title: file, library: library }),
      );
    }
  });

  folders.forEach((folder) => {
    extractFilesFromFolder(folder, files, videoExt, () => idCounter++, folder);
  });

  files.forEach((file) => {
    file.mediaInfo = extractInfo(file.name);
    file.library = assignDefaultLibrary(file, librariesData, libraries);
  });

  return files;
}

// Recursively scan all folders and subfolders for files
function extractFilesFromFolder(
  folderPath: string,
  filesList: MediaFile[],
  videoExt: string[],
  getId: () => number,
  root: string
) {
  const entries = fs.readdirSync(folderPath);

  entries.forEach((entry) => {
    const entryPath = path.join(folderPath, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      if (entry !== "temp") {
        extractFilesFromFolder(entryPath, filesList, videoExt, getId, root);
      }
    } else {
      const ext = path.extname(entry);

      if (videoExt.includes(ext)) {
        const file: MediaFile = {
          id: getId(),
          path: entryPath,
          name: path.basename(entry, ext),
          ext: ext,
          mediaInfo: {},
          library: {},
          root: root,
        };

        filesList.push(file);
      }
    }
  });

  return filesList;
}

function readLibraryFiles(path: string) {
  const files = fs.readdirSync(path);
  return files;
}
