const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { YSocketIO } = require('y-socket.io/dist/server');

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO with CORS enabled for development
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
  }
});

// Setup YSocketIO
const ysocketio = new YSocketIO(io);
ysocketio.initialize();

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
