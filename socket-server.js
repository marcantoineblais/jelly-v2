// Minimal standalone WebSocket server using ws
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 4001 });
let lastStatus = null;
let backendClient = null;

wss.on('connection', (client, request) => {
  console.log('New client connected');
  
  // Send last status to new client if available
  if (lastStatus) {
    client.send(lastStatus);
  }

  // Identify backend (route.ts) by first message
  client.once('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data && data.currentFile === 'Process started') {
        backendClient = client;
      }
    } catch {}
  });

  // Now set up normal message handler
  client.on('message', (msg) => {    
    if (client === backendClient) {
      lastStatus = msg;
      
      // Always forward to all other clients (including new ones)
      wss.clients.forEach((other) => {
        other.send(msg);
      });

      // If the transfer is done, clear lastStatus and backendClient
      try {
        const data = JSON.parse(msg);
        if (data.isCompleted) {
          lastStatus = null;
          backendClient = null;
        }
      } catch {}
    }
  });

  client.on('close', () => {
    if (client === backendClient) {
      backendClient = null;
      lastStatus = null;
      
      // Notify all frontends to abort transfer
      const abortMsg = JSON.stringify({ error: 'Transfer aborted: server connection lost.' });
      wss.clients.forEach((other) => {
        other.send(abortMsg);
      });
    } else {      
      console.log('Client has disconnected');
    }
  });
});

console.log('WebSocket server running on ws://localhost:4001');
