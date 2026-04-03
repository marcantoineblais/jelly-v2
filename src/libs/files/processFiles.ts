import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import { WebSocket } from "ws";
import { formatNumber } from "@/src/libs/files/formatNumber";
import { createFilename } from "@/src/libs/files/createFilename";
import { readConfig } from "@/src/libs/readConfig";
import { removeTorrentsForFile } from "@/src/libs/qbit/removeTorrents";
import { cleanupTransferredFolders } from "@/src/libs/files/cleanupFolders";
import {
  sendProgress,
  sendTransferStarted,
  sendTransferCompleted,
} from "@/src/libs/socket/transferProgress";
import type { FileProgress } from "@/src/libs/socket/transferProgress";
import type { MediaFile } from "@/src/types/MediaFile";

const PROGRESS_THROTTLE_MS = 150;
const STREAM_HIGH_WATER_MARK = 16 * 1024 * 1024;
const FLUSH_SIZE = 4 * 1024 * 1024; // 4MB — minimum write size to reduce I/O on SMR drives over SMB
const CONFIG = readConfig();

export interface TransferError {
  file: MediaFile;
  message: string;
}

// --- File transfer ---
async function copyFileWithProgress({
  file,
  updatedPath,
  errors,
  ws,
  progress,
}: {
  file: MediaFile;
  updatedPath: string;
  errors: TransferError[];
  ws: WebSocket;
  progress: FileProgress;
}): Promise<void> {
  try {
    const destDir = path.dirname(updatedPath);
    try {
      await fs.access(destDir);
    } catch {
      await fs.mkdir(destDir, { recursive: true });
    }

    const stat = await fs.stat(file.path);
    const fileSize = stat.size;

    sendProgress({
      ws,
      payload: {
        ...progress,
        currentFileBytesTransferred: 0,
        currentFileSize: fileSize,
        errors,
      },
    });

    let bytesTransferred = 0;
    let lastSend = 0;

    const readStream = fsSync.createReadStream(file.path, {
      highWaterMark: STREAM_HIGH_WATER_MARK,
    });
    const writeStream = fsSync.createWriteStream(updatedPath, {
      highWaterMark: STREAM_HIGH_WATER_MARK,
    });

    let pendingBuffer: Buffer | null = null;

    const progressTransform = new Transform({
      readableHighWaterMark: STREAM_HIGH_WATER_MARK,
      writableHighWaterMark: STREAM_HIGH_WATER_MARK,
      transform(chunk, _encoding, callback) {
        bytesTransferred += chunk.length;
        const now = Date.now();
        if (now - lastSend >= PROGRESS_THROTTLE_MS) {
          lastSend = now;
          sendProgress({
            ws,
            payload: {
              ...progress,
              currentFileBytesTransferred: bytesTransferred,
              currentFileSize: fileSize,
              totalBytesTransferred:
                progress.totalBytesTransferred + bytesTransferred,
              errors,
            },
          });
        }

        pendingBuffer = pendingBuffer
          ? Buffer.concat([pendingBuffer, chunk])
          : chunk;

        if (pendingBuffer && pendingBuffer.length >= FLUSH_SIZE) {
          this.push(pendingBuffer);
          pendingBuffer = null;
        }
        callback();
      },
      flush(callback) {
        if (pendingBuffer) {
          this.push(pendingBuffer);
          pendingBuffer = null;
        }
        callback();
      },
    });

    await pipeline(readStream, progressTransform, writeStream);

    sendProgress({
      ws,
      payload: {
        ...progress,
        currentFileBytesTransferred: fileSize,
        currentFileSize: fileSize,
        totalBytesTransferred: progress.totalBytesTransferred + fileSize,
        errors,
      },
    });

    await removeTorrentsForFile(file.path, CONFIG.downloadPaths);
    await fs.unlink(file.path);
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }
    errors.push({ file, message });
  }
}

// --- Main job ---

function buildDestinationPath(file: MediaFile): string | null {
  const filename = createFilename(file.mediaInfo);
  const basepath = file.library?.path;
  const type = file.library?.type;
  const season = file.mediaInfo?.season;
  const year = file.mediaInfo?.year;
  let folderName = file.mediaInfo?.title;
  if (year && folderName) folderName = `${folderName} (${year})`;

  if (!filename || !basepath) return null;

  if (type === undefined || type === null) {
    return path.join(basepath, filename + file.ext);
  }

  if (!folderName) return null;

  if (type === "show") {
    return path.join(
      basepath,
      folderName,
      season ? `Season ${formatNumber(season)}` : "Specials",
      filename + file.ext,
    );
  }

  return path.join(basepath, folderName, filename + file.ext);
}

export async function processFilesJob(
  files: MediaFile[],
  ws: WebSocket,
): Promise<void> {
  const errors: TransferError[] = [];
  const filesToProcess: {
    file: MediaFile;
    updatedPath: string;
    filename: string;
    fileSize: number;
  }[] = [];
  let totalSize = 0;

  for (const file of files) {
    const updatedPath = buildDestinationPath(file);
    const filename = createFilename(file.mediaInfo);

    if (!updatedPath || !filename) {
      errors.push({
        file,
        message: !updatedPath
          ? "Could not determine destination path (check library and title)"
          : "Could not build filename",
      });
      continue;
    }

    try {
      const stat = await fs.stat(file.path);
      totalSize += stat.size;
      filesToProcess.push({ file, updatedPath, filename, fileSize: stat.size });
    } catch (err) {
      errors.push({
        file,
        message:
          err instanceof Error ? err.message : "File not found or inaccessible",
      });
    }
  }

  sendTransferStarted({
    ws,
    totalFiles: filesToProcess.length,
    totalSize,
    errors,
  });

  const transferredFolders = new Set<string>();
  let totalBytesTransferred = 0;

  for (let i = 0; i < filesToProcess.length; i++) {
    const { file, updatedPath, filename, fileSize } = filesToProcess[i];

    const errorCountBefore = errors.length;
    await copyFileWithProgress({
      file,
      updatedPath,
      errors,
      ws,
      progress: {
        currentFile: filename,
        processedFiles: i,
        totalFiles: filesToProcess.length,
        totalBytesTransferred,
        totalSize,
      },
    });

    const transferSucceeded = errors.length === errorCountBefore;
    if (transferSucceeded) {
      transferredFolders.add(path.dirname(file.path));
    }

    totalBytesTransferred += fileSize;
  }

  await cleanupTransferredFolders({
    transferredFolders,
    videosExt: CONFIG.videosExt,
    downloadRoots: CONFIG.downloadPaths,
  });

  sendTransferCompleted({
    ws,
    totalFiles: filesToProcess.length,
    errors,
  });
}
