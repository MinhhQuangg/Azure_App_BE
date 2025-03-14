// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/rooms/:roomId/messages", messageController.createMessage);

router.get("/rooms/:roomId/messages/latest", messageController.getSingleMessage);

router.delete("/rooms/:roomId/messages/:messageId", messageController.deleteMessage);

module.exports = router;