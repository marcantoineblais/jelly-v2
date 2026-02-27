import fs from "fs/promises";
import path from "path";
import { log } from "@/src/libs/logger";

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

async function containsVideoFiles({
  dirPath,
  videosExt,
}: {
  dirPath: string;
  videosExt: string[];
}): Promise<boolean> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDirPath = path.join(dirPath, entry.name);
      const subDirHasVideos = await containsVideoFiles({
        dirPath: subDirPath,
        videosExt,
      });
      if (subDirHasVideos) {
        return true;
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const isVideoFile = videosExt.some((e) => e.toLowerCase() === ext);
      if (isVideoFile) {
        return true;
      }
    }
  }

  return false;
}

function isDownloadRoot({
  dirPath,
  downloadRoots,
}: {
  dirPath: string;
  downloadRoots: string[];
}): boolean {
  const normalizedDir = path.normalize(dirPath);
  const isRoot = downloadRoots.some(
    (root) => normalizedDir === path.normalize(root),
  );
  return isRoot;
}

/**
 * After all transfers, clean up the source folders:
 *
 * 1. Collect the direct parent folder of each successfully transferred file.
 * 2. Process them deepest-first so nested folders are handled before parents.
 * 3. For each folder: if no video files remain anywhere inside, delete it
 *    entirely (removes leftover .jpg, .torrent, .nfo, etc.).
 * 4. After deleting a folder, walk up and remove any now-empty parent folders.
 *    Stop at the download root (never delete the root itself).
 *
 * Folders that were not part of the transfer (e.g. a sibling "Season 2"
 * when only "Season 1" files were transferred) are never touched.
 */
export async function cleanupTransferredFolders({
  transferredFolders,
  videosExt,
  downloadRoots,
}: {
  transferredFolders: Set<string>;
  videosExt: string[];
  downloadRoots: string[];
}): Promise<void> {
  const source = "Cleanup";

  if (
    videosExt.length === 0 ||
    downloadRoots.length === 0 ||
    transferredFolders.size === 0
  ) {
    return;
  }

  // Sort deepest folders first so children are processed before parents
  const sortedFolders = [...transferredFolders].sort(
    (a, b) => b.split(path.sep).length - a.split(path.sep).length,
  );

  for (const folder of sortedFolders) {
    try {
      const exists = await directoryExists(folder);
      if (!exists) continue;

      const hasVideos = await containsVideoFiles({
        dirPath: folder,
        videosExt,
      });
      if (hasVideos) continue;

      log({ source, message: "Deleting folder", data: folder });
      await fs.rm(folder, { recursive: true });

      // Walk up and remove parent folders that have no video files left
      let parentDir = path.dirname(folder);
      while (!isDownloadRoot({ dirPath: parentDir, downloadRoots })) {
        const parentExists = await directoryExists(parentDir);
        if (!parentExists) {
          break;
        }

        const parentHasVideos = await containsVideoFiles({
          dirPath: parentDir,
          videosExt,
        });
        if (parentHasVideos) {
          break;
        }

        log({ source, message: "Deleting parent folder", data: parentDir });
        await fs.rm(parentDir, { recursive: true });
        parentDir = path.dirname(parentDir);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log({
        source,
        message: "Error deleting folder",
        data: { folder, error: message },
        level: "warn",
      });
    }
  }
}
