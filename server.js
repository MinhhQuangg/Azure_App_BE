const http = require("http");
const app = require('./app');
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const port = process.env.PORT || 3000;
const db = require('./config/db.config');

app.set("socketio", io);

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  socket.userId = userId;
  next();
});

io.on("connection", (socket) => {
  console.log("Client connected with userId:", socket.userId);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.userId} joined room ${roomId}`);
  });
  socket.on ("send-message", (message, roomID) => {
    if (roomID === ""){
      socket.broadcast.emit("receive-message", message);
    } else {
      socket.to(roomID).emit("receive-message", message);
    }
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
