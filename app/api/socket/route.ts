export const runtime = "nodejs";

import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";

export function SOCKET(
  client: WebSocket,
  _request: IncomingMessage,
  server: WebSocketServer,
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