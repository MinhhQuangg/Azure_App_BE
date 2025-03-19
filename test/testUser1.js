// testJoinRoom1.js
const { io } = require("socket.io-client");

// Connect to the server (ensure your server is running on localhost:3000)
const socket = io("http://localhost:3000", {
  transports: ["websocket"],
});

// Specify the room to join
const roomId = "testRoom1";

socket.on("connect", () => {
  console.log("Connected to server with socket ID:", socket.id);
  console.log(`Joining room: ${roomId}`);
  socket.emit("joinRoom", roomId);
  socket.emit("send-message", "Hello, world!", roomId);
});

socket.on("receive-message", (message) => {
  console.log("Received message:", message);
});