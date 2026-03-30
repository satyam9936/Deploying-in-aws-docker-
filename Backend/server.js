const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { YSocketIO } = require('y-socket.io/dist/server');
const path = require('path');

const app = express();
app.use(express.static("public"))

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

const frontendPath = path.join(__dirname, '../Frontend/dist');
app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
