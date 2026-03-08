import path from "path";
import { qbitRequest } from "./client";
import { log } from "@/src/libs/logger";

function normalizePathForCompare({
  filePath,
  downloadRoots,
}: {
  filePath: string;
  downloadRoots: string[];
}): string {
  let norm = path.normalize(filePath).replace(/\\/g, "/").replace(/\/+/g, "/");
  for (const root of downloadRoots) {
    const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+/g, "/");
    if (norm === normalizedRoot || norm.startsWith(normalizedRoot + "/")) {
      norm = "/downloads" + norm.slice(normalizedRoot.length);
      break;
    }
  }
  return norm;
}

function filePathMatchesTorrent({
  filePath,
  contentPath,
  downloadRoots,
}: {
  filePath: string;
  contentPath: string;
  downloadRoots: string[];
}): boolean {
  const normFile = normalizePathForCompare({ filePath, downloadRoots });
  const normContent = normalizePathForCompare({
    filePath: contentPath,
    downloadRoots,
  });
  return normFile === normContent || normFile.startsWith(normContent + "/");
}

interface TorrentInfo {
  hash: string;
  content_path?: string;
  contentPath?: string;
}

export async function removeTorrentsForFile(
  filePath: string,
  downloadPaths: string[],
): Promise<void> {
  try {
    const torrents = await qbitRequest<TorrentInfo[]>("/torrents/info");
    if (!Array.isArray(torrents)) return;

    const toRemove: string[] = [];
    for (const t of torrents) {
      const contentPath = t.content_path ?? t.contentPath ?? "";
      const matches = filePathMatchesTorrent({
        filePath,
        contentPath,
        downloadRoots: downloadPaths,
      });
      if (contentPath && matches) {
        toRemove.push(t.hash);
      }
    }

    for (const hash of toRemove) {
      await qbitRequest("/torrents/delete", {
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        body: new URLSearchParams({
          hashes: hash,
          deleteFiles: "false",
        }).toString(),
      });
    }
  } catch (err) {
    log({
      source: "removeTorrents",
      message: "Could not remove torrents for file",
      data: err,
      level: "warn",
    });
  }
}
