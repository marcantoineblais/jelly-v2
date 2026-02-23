import fs from "fs";
import path from "path";
import { MediaFile } from "../../types/MediaFile";
import { extractInfo } from "./extractInfo";
import { assignDefaultLibrary } from "./assignDefaultLibrary";
import { MediaLibrary } from "@/src/types/MediaLibrary";

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
    extractFilesFromFolder(
      folder,
      files,
      videoExt,
      () => idCounter++,
      path.normalize(folder),
    );
  });

  files.forEach((file) => {
    const parentName = path.basename(path.dirname(file.path));
    file.mediaInfo = extractInfo(file.name, parentName);
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
  root: string,
) {
  const exists = fs.existsSync(folderPath);
  if (!exists) {
    console.error(`[Read Folders Lib] Folder does not exist: ${folderPath}`);
    return filesList;
  }
  let entries: string[];
  try {
    entries = fs.readdirSync(folderPath);
  } catch {
    return filesList;
  }

  entries.forEach((entry) => {
    const entryPath = path.join(folderPath, entry);
    let stats: fs.Stats;
    try {
      stats = fs.statSync(entryPath);
    } catch {
      // File may have been deleted, moved, or is inaccessible during scan
      return;
    }

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
          size: stats.size,
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

function readLibraryFiles(libraryPath: string) {
  if (!fs.existsSync(libraryPath)) return [];

  try {
    return fs.readdirSync(libraryPath);
  } catch {
    return [];
  }
}
