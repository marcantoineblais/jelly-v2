const http = require("http");
const express = require("express");
const { WebSocket } = require("ws");
const { formatNumber } = require("./app/libs/files/formatNumber.js");
const { createFilename } = require("./app/libs/files/createFilename.js");
const app = express();
app.use(express.json({ limit: "50mb" }));
const fs = require("fs/promises");
const path = require("path");

async function copyFile(file, updatedPath, errors) {
  try {
    const destDir = path.dirname(updatedPath);
    try {
      await fs.access(destDir);
    } catch {
      await fs.mkdir(destDir, { recursive: true });
    }
    await fs.copyFile(file.path, updatedPath);
    await fs.unlink(file.path);
    await deleteEmptyFolders(path.dirname(file.path));
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
  ws.send(
    JSON.stringify({
      currentFile: "Process started",
      processedFiles: 0,
      totalFiles: files.length,
      errors,
    })
  );
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = createFilename(file.mediaInfo);
    const basepath = file.library.path;
    const type = file.library.type;
    const season = file.mediaInfo?.season;
    const title = file.mediaInfo?.title;
    if (filename && basepath && title) {
      const updatedPath = path.join(
        basepath,
        type === "show" ? title : "",
        type === "show" && season
          ? `Season ${formatNumber(season)}`
          : "Specials",
        filename + file.ext
      );
      ws.send(
        JSON.stringify({
          currentFile: filename,
          processedFiles: i + 1,
          totalFiles: files.length,
          errors,
        })
      );
      await copyFile(file, updatedPath, errors);
    }
  }
  ws.send(
    JSON.stringify({
      currentFile: "Files transfer completed",
      processedFiles: files.length,
      totalFiles: files.length,
      isCompleted: true,
      errors,
    })
  );
}

app.post("/process-files", async (req, res) => {
  const files = req.body.files;
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: "Invalid files array" });
  }
  // Open a real WebSocket connection to the socket server
  const ws = new WebSocket("ws://localhost:4001");
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  await processFilesJob(files, ws);
  ws.close();
  res.json({ ok: true });
});

const server = http.createServer(app);
server.listen(3002, () => {
  console.log("HTTP server for file jobs running on http://localhost:4002");
});
