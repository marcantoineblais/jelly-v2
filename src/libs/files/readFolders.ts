import fs from "fs";
import path from "path";
import { MediaFile } from "../../types/MediaFile";
import { extractInfo } from "./extractInfo";
import { assignDefaultMediaInfo } from "./assignDefaultMediaInfo";
import { MediaLibrary } from "@/src/types/MediaLibrary";
import { log } from "@/src/libs/logger";

export function readFolders(
  folders: string[],
  videoExt: string[],
  libraries: MediaLibrary[],
) {
  let idCounter = 1;
  const librariesData = readLibrariesFiles(libraries);

  const files = folders.map((folder) => {
    const list = extractFilesFromFolder(folder, videoExt, () => idCounter++);
    const rootDir = path.normalize(folder);
    list.forEach((file) => {
      file.mediaInfo = extractInfo(file.path, rootDir);
      assignDefaultMediaInfo(file, librariesData, libraries);
    });

    return list;
  });

  return files.flat();
}

// Recursively scan all folders and subfolders for files
function extractFilesFromFolder(
  folderPath: string,
  videoExt: string[],
  getId: () => number,
  depth: number = 0,
): MediaFile[] {
  const exists = fs.existsSync(folderPath);
  if (!exists) {
    log({
      source: "readFolders",
      message: `Folder does not exist: ${folderPath}`,
      level: "error",
    });
    return [];
  }
  let entries: string[];
  try {
    entries = fs.readdirSync(folderPath);
  } catch {
    return [];
  }

  return entries
    .map((entry) => {
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
          return extractFilesFromFolder(entryPath, videoExt, getId, depth + 1);
        }
      } else {
        const ext = path.extname(entry);

        if (videoExt.includes(ext)) {
          const baseName = path.basename(entry, ext);
          return {
            id: getId(),
            path: entryPath,
            name: baseName || path.basename(entry) || entry,
            ext: ext,
            size: stats.size,
            mediaInfo: {},
            library: {},
          };
        }
      }
    })
    .filter((el) => el)
    .flat() as MediaFile[];
}

function readLibraryFiles(libraryPath: string) {
  if (!fs.existsSync(libraryPath)) return [];

  try {
    return fs.readdirSync(libraryPath);
  } catch {
    return [];
  }
}

function readLibrariesFiles(libraries: MediaLibrary[]) {
  const data: { title: string; library: MediaLibrary }[] = [];
  libraries.forEach((library) => {
    if (library.type === "show" && library.path) {
      const files = readLibraryFiles(library.path);
      files.forEach((file) => data.push({ title: file, library: library }));
    }
  });

  return data;
}
