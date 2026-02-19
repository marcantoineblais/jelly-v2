require("dotenv").config();
const http = require("http");
const express = require("express");
const { WebSocket } = require("ws");
const { Transform } = require("stream");
const { formatNumber } = require("./app/libs/files/formatNumber.js");
const { createFilename } = require("./app/libs/files/createFilename.js");
const app = express();
app.use(express.json({ limit: "50mb" }));
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");

const PROGRESS_THROTTLE_MS = 150;
let isTransferActive = false;

function sendProgress(ws, payload) {
  try {
    ws.send(JSON.stringify(payload));
  } catch (_) {}
}

async function copyFileWithProgress(
  file,
  updatedPath,
  errors,
  ws,
  { processedFiles, totalFiles, currentFile, totalBytesTransferred, totalSize },
) {
  try {
    const destDir = path.dirname(updatedPath);
    try {
      await fs.access(destDir);
    } catch {
      await fs.mkdir(destDir, { recursive: true });
    }

    const stat = await fs.stat(file.path);
    const fileSize = stat.size;

    sendProgress(ws, {
      currentFile,
      processedFiles,
      totalFiles,
      currentFileBytesTransferred: 0,
      currentFileSize: fileSize,
      totalBytesTransferred,
      totalSize,
      errors,
    });

    await new Promise((resolve, reject) => {
      const readStream = fsSync.createReadStream(file.path);
      const writeStream = fsSync.createWriteStream(updatedPath);
      let bytesTransferred = 0;
      let lastSend = 0;
      let settled = false;

      function done(err) {
        if (settled) return;
        settled = true;
        readStream.destroy();
        writeStream.destroy();
        if (err) reject(err);
        else resolve();
      }

      const progressTransform = new Transform({
        transform(chunk, _encoding, callback) {
          bytesTransferred += chunk.length;
          const now = Date.now();
          if (now - lastSend >= PROGRESS_THROTTLE_MS) {
            lastSend = now;
            sendProgress(ws, {
              currentFile,
              processedFiles,
              totalFiles,
              currentFileBytesTransferred: bytesTransferred,
              currentFileSize: fileSize,
              totalBytesTransferred: totalBytesTransferred + bytesTransferred,
              totalSize,
              errors,
            });
          }
          callback(null, chunk);
        },
      });

      readStream.on("error", (err) => done(err));
      writeStream.on("error", (err) => done(err));
      progressTransform.on("error", (err) => done(err));

      writeStream.on("finish", () => {
        sendProgress(ws, {
          currentFile,
          processedFiles,
          totalFiles,
          currentFileBytesTransferred: fileSize,
          currentFileSize: fileSize,
          totalBytesTransferred: totalBytesTransferred + fileSize,
          totalSize,
          errors,
        });
        done();
      });

      readStream.pipe(progressTransform).pipe(writeStream);
    });

    await fs.unlink(file.path);
    await deleteEmptyFolders(file);
  } catch (error) {
    let message = "Unknown error";
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      message = error.message;
    }
    errors.push({ file, message });
  }
}

async function deleteEmptyFolders(file) {
  let currentDir = path.dirname(file.path);
  while (currentDir !== file.root) {
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

async function processFilesJob(files, ws) {
  const errors = [];
  const filesToProcess = [];
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = createFilename(file.mediaInfo);
    const basepath = file.library.path;
    const type = file.library.type;
    const season = file.mediaInfo?.season;
    const year = file.mediaInfo?.year;
    let folderName = file.mediaInfo?.title;
    if (year && folderName) folderName = `${folderName} (${year})`;

    if (filename && basepath && folderName) {
      let updatedPath = "";
      if (type === "show") {
        updatedPath = path.join(
          basepath,
          folderName,
          season ? `Season ${formatNumber(season)}` : "Specials",
          filename + file.ext,
        );
      } else {
        updatedPath = path.join(basepath, folderName, filename + file.ext);
      }

      try {
        const stat = await fs.stat(file.path);
        totalSize += stat.size;
        filesToProcess.push({
          file,
          updatedPath,
          filename,
          fileSize: stat.size,
        });
      } catch {
        filesToProcess.push({ file, updatedPath, filename, fileSize: 0 });
      }
    }
  }

  ws.send(
    JSON.stringify({
      currentFile: "Process started",
      processedFiles: 0,
      totalFiles: filesToProcess.length,
      totalBytesTransferred: 0,
      totalSize,
      errors,
    }),
  );

  let totalBytesTransferred = 0;
  for (let i = 0; i < filesToProcess.length; i++) {
    const { file, updatedPath, filename, fileSize } = filesToProcess[i];

    await copyFileWithProgress(file, updatedPath, errors, ws, {
      currentFile: filename,
      processedFiles: i,
      totalFiles: filesToProcess.length,
      totalBytesTransferred,
      totalSize,
    });

    totalBytesTransferred += fileSize;
  }
  ws.send(
    JSON.stringify({
      currentFile: "Files transfer completed",
      processedFiles: filesToProcess.length,
      totalFiles: filesToProcess.length,
      isCompleted: true,
      errors,
    }),
  );
}

app.post("/process-files", async (req, res) => {
  if (isTransferActive) {
    return res
      .status(409)
      .json({ error: "A file transfer is already in progress" });
  }

  const files = req.body.files;
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: "Invalid files array" });
  }

  const socketUrl = process.env.SOCKET_SERVER_URL;
  if (!socketUrl) {
    return res.status(500).json({ error: "SOCKET_SERVER_WS_URL is not set" });
  }

  isTransferActive = true;
  let ws;

  try {
    ws = new WebSocket(socketUrl.replace(/\/$/, ""));
    await new Promise((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
    });

    await processFilesJob(files, ws);
    ws.close();
    res.json({ ok: true });
  } catch (error) {
    console.error("Error during file transfer", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error processing files" });
    }
  } finally {
    isTransferActive = false;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }
});

const port = parseInt(process.env.FILE_SERVER_PORT || "3002", 10);
const server = http.createServer(app);
server.listen(port, () => {
  console.log(
    `File server listening on port ${port} (FILE_SERVER_URL=${process.env.FILE_SERVER_URL || "not set"})`,
  );
});
