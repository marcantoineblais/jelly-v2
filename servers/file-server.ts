import "dotenv/config";
import http from "http";
import express from "express";
import { WebSocket } from "ws";
import { processFilesJob } from "@/src/libs/files/processFiles";

const app = express();
app.use(express.json({ limit: "50mb" }));

let isTransferActive = false;

app.post("/process-files", async (req: express.Request, res: express.Response) => {
  if (isTransferActive) {
    return res
      .status(409)
      .json({ error: "A file transfer is already in progress" });
  }

  const files = req.body.files;
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: "Invalid files array" });
  }

  const socketUrl = process.env.SOCKET_SERVER_URL || "ws://localhost:3001";

  isTransferActive = true;
  let ws: WebSocket | undefined;

  try {
    ws = new WebSocket(socketUrl.replace(/\/$/, ""));
    await new Promise<void>((resolve, reject) => {
      ws!.on("open", resolve);
      ws!.on("error", reject);
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
