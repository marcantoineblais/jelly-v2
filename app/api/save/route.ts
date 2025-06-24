import { createFilename } from "@/app/libs/files/createFilename";
import { formatNumber } from "@/app/libs/files/formatNumber";
import { MediaFile } from "@/app/types/MediaFile";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import fs from "fs/promises";

async function processFilesJob(files: MediaFile[]) {
  const socket = new WebSocket(`ws://localhost:3000/api/save`);
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
        type === "show" && season ? `Season ${formatNumber(season)}` : "",
        filename + file.ext
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

async function copyFile(
  file: MediaFile,
  updatedPath: string,
  errors: { file: MediaFile; message: string }[]
) {
  try {
    const destDir = path.dirname(updatedPath);
    try { // Will create the new path if it doesnt exist
      await fs.access(destDir);
    } catch {
      await fs.mkdir(destDir, { recursive: true });
    }

    await fs.copyFile(file.path, updatedPath);
    await fs.unlink(file.path);
  } catch (error: any) {
    console.error("Error moving file:", error);
    errors.push({ file: file, message: error.message });
  }
}

export async function POST(request: NextRequest) {
  const files: MediaFile[] = await request.json();
  processFilesJob(files).catch((error) => {
    return NextResponse.json({ ok: false, error: error.message });
  });

  return NextResponse.json({ ok: true });
}

export function SOCKET(
  client: WebSocket,
  _request: IncomingMessage,
  server: WebSocketServer
) {
  console.log("New client connected");

  client.on("message", (message) => {
    server.clients.forEach((other) => {
      if (other !== client && other.readyState === WebSocket.OPEN) {
        other.send(message);
      }
    });
  });

  client.on("close", () => {
    console.log("Client has disconnected");
  });
}
