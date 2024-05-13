const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const clients = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('<h1> Server is Running!</h1>');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'login') {
      const username = data.username;
      clients.set(username, ws);
      console.log(`Client '${username}' connected`);
      const joinMessage = {
        type: 'message',
        username: 'server',
        content: `${username} has joined the chat!`
      };
      broadcast(JSON.stringify(joinMessage));
    } else if (data.type === 'message') {
      const username = data.username;
      const content = data.content;
      const messageToSend = JSON.stringify({ type: 'message', username, content });
      broadcast(messageToSend);
    }
  });

  ws.on('close', () => {
    const username = getUsernameByWS(ws);
    console.log(`Client '${username}' disconnected`);
    clients.delete(username);
    const disconnectMessage = {
      type: 'message',
      username: 'server',
      content: `${username} has left the chat!`
    };
    broadcast(JSON.stringify(disconnectMessage));
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcast(message) {
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function getUsernameByWS(ws) {
  for (const [username, clientWs] of clients.entries()) {
    if (clientWs === ws) {
      return username;
    }
  }
}

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
