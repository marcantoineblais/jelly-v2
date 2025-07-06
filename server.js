// Minimal standalone WebSocket server using ws
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (client, request) => {
  console.log('New client connected');

  client.on('message', (message) => {
    wss.clients.forEach((other) => {
      if (other !== client && other.readyState === 1) { // 1 === WebSocket.OPEN
        other.send(message);
      }
    });
  });

  client.on('close', () => {
    console.log('Client has disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:3001');
