import { createFilename } from "@/app/libs/files/createFilename";
import { formatNumber } from "@/app/libs/files/formatNumber";
import { MediaFile } from "@/app/types/MediaFile";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { WebSocket } from "ws";
import fs from "fs/promises";
import { readConfig } from "@/app/libs/readConfig";

async function processFilesJob(files: MediaFile[]) {
  const socket = new WebSocket(`ws://localhost:3001`);
  const errors: { file: MediaFile; message: string }[] = [];

  await new Promise<void>((resolve, reject) => {
    socket.onopen = () => resolve();
    socket.onerror = (err) => reject(err);
  });

  const content = {
    currentFile: "Process started",
    processedFiles: 0,
    totalFiles: files.length,
    errors: errors,
  };
  socket.send(JSON.stringify(content));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = createFilename(file.mediaInfo);
    const basepath = file.library.path;
    const type = file.library.type;
    const season = file.mediaInfo.season;
    const title = file.mediaInfo.title;

    if (filename && basepath && title) {
      const updatedPath = path.join(
        basepath,
        type === "show" ? title : "",
        type === "show" && season ? `Season ${formatNumber(season)}` : "Specials",
        filename + file.ext,
      );
      const content = {
        currentFile: filename,
        processedFiles: i + 1,
        totalFiles: files.length,
        errors: errors,
      };

      socket.send(JSON.stringify(content));
      await copyFile(file, updatedPath, errors);
    }
  }

  socket.close();
}

async function deleteEmptyFolders(startDir: string) {
  const { downloadPaths } = readConfig();
  const roots = downloadPaths.map((p: string) => path.resolve(p));
  let currentDir = startDir;
  while (!roots.includes(path.resolve(currentDir))) {
    try {
      const files = await fs.readdir(currentDir);
      if (files.length === 0) {
        await fs.rmdir(currentDir);
        currentDir = path.dirname(currentDir);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

async function copyFile(
  file: MediaFile,
  updatedPath: string,
  errors: { file: MediaFile; message: string }[],
) {
  try {
    const destDir = path.dirname(updatedPath);
    try {
      // Will create the new path if it doesnt exist
      await fs.access(destDir);
    } catch {
      await fs.mkdir(destDir, { recursive: true });
    }

    await fs.copyFile(file.path, updatedPath);
    await fs.unlink(file.path);
    await deleteEmptyFolders(path.dirname(file.path));
  } catch (error) {
    console.error("Error moving file:", error);
    let message = "Unknown error";
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }
    errors.push({ file, message });
  }
}

export async function POST(request: NextRequest) {
  const files: MediaFile[] = await request.json();

  try {
    await processFilesJob(files)
  } catch (error) {
    console.log("Encounted error while processing files:", error);
    let message = "Unknown error";
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }

    return NextResponse.json({ ok: false, error: message });
  };

  return NextResponse.json({ ok: true });
}
