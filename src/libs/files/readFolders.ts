import fs from "fs";
import path from "path";
import { MediaFile } from "../../types/MediaFile";
import { extractInfo } from "./extractInfo";
import { assignDefaultLibrary } from "./assignDefaultLibrary";
import { MediaLibrary } from "@/src/types/MediaLibrary";
import { log } from "@/src/libs/logger";

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
  });

  // Files in the same folder are usually episodes of the same show,
  // so use the most common title among siblings as the shared title
  const folderGroups = new Map<string, MediaFile[]>();
  files.forEach((file) => {
    const dir = path.dirname(file.path);
    if (!folderGroups.has(dir)) {
      folderGroups.set(dir, []);
    }
    folderGroups.get(dir)!.push(file);
  });

  folderGroups.forEach((group) => {
    if (group.length < 2) return;

    // Count occurrences of each title
    const titleCounts = new Map<string, number>();
    group.forEach((file) => {
      const title = file.mediaInfo?.title || "";
      titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
    });

    // Find the most common title
    let mostCommonTitle = "";
    let maxCount = 0;
    titleCounts.forEach((count, title) => {
      if (title && count > maxCount) {
        mostCommonTitle = title;
        maxCount = count;
      }
    });

    // Apply the most common title to all files in the group
    if (mostCommonTitle && maxCount > 1) {
      group.forEach((file) => {
        if (file.mediaInfo) {
          file.mediaInfo.title = mostCommonTitle;
        }
      });
    }
  });

  files.forEach((file) => {
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
    log({ source: "readFolders", message: `Folder does not exist: ${folderPath}`, level: "error" });
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
