import "dotenv/config";
import http from "http";
import express from "express";
import { WebSocket } from "ws";
import { processFilesJob } from "@/src/libs/files/processFiles";

const app = express();
app.use(express.json({ limit: "50mb" }));

let isTransferActive = false;

app.post(
  "/process-files",
  async (req: express.Request, res: express.Response) => {
    if (isTransferActive) {
      return res
        .status(409)
        .json({ error: "A file transfer is already in progress" });
    }

    const files = req.body.files;
    if (!Array.isArray(files)) {
      return res.status(400).json({ error: "Invalid files array" });
    }
    
    isTransferActive = true;
    const socketUrl = process.env.SOCKET_SERVER_URL || "ws://localhost:3001";
    
    // Run the transfer in the background so the HTTP response is not blocked.
    const ws = new WebSocket(socketUrl.replace(/\/$/, ""));
    ws.on("open", async () => {
      try {
        res.json({ ok: true });
        await processFilesJob(files, ws);
      } catch (error) {
        console.error("Error during file transfer", error);
      } finally {
        isTransferActive = false;
        if (ws.readyState === WebSocket.OPEN) ws.close();
      }
    });
    ws.on("error", (error) => {
      console.error("WebSocket connection failed", error);
      res.json({ error: "The websocket connection could not be established."})
      isTransferActive = false;
    });
  },
);

const port = parseInt(process.env.FILE_SERVER_PORT || "3002", 10);
const server = http.createServer(app);
server.listen(port, () => {
  console.log(
    `File server listening on port ${port} (FILE_SERVER_URL=${process.env.FILE_SERVER_URL || "not set"})`,
  );
});
