import "dotenv/config";
import { WebSocketServer, WebSocket, RawData } from "ws";

const port = parseInt(process.env.SOCKET_SERVER_PORT || "3001", 10);
const wss = new WebSocketServer({ port, host: "0.0.0.0" });
let lastStatus: RawData | null = null;
let backendClient: WebSocket | null = null;

wss.on("connection", (client) => {
  console.log("New client connected");

  // Send last status to new client if available
  if (lastStatus) {
    client.send(lastStatus);
  }

  // Identify backend (route.ts) by first message
  client.once("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data && data.currentFile === "Process started") {
        backendClient = client;
      }
    } catch {}
  });

  // Now set up normal message handler
  client.on("message", (msg) => {
    if (client === backendClient) {
      lastStatus = msg;

      // Always forward to all other clients (including new ones)
      wss.clients.forEach((other) => {
        other.send(msg);
      });

      // If the transfer is done, clear lastStatus and backendClient
      try {
        const data = JSON.parse(msg.toString());
        if (data.isCompleted) {
          lastStatus = null;
          backendClient = null;
        }
      } catch {}
    }
  });

  client.on("close", () => {
    if (client === backendClient) {
      backendClient = null;
      lastStatus = null;

      // Notify all frontends to abort transfer
      const abortMsg = JSON.stringify({
        error: "Transfer aborted: server connection lost.",
      });
      wss.clients.forEach((other) => {
        other.send(abortMsg);
      });
    } else {
      console.log("Client has disconnected");
    }
  });
});

console.log(`WebSocket server listening on port ${port}`);
