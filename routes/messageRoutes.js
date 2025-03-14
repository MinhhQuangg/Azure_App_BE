const express = require("express");
const router = express.Router();
const messageController = require("./controllers/messageController");

router.get("/rooms/:roomId/messages", messageController.getMessagesForRoom);

router.post("/rooms/:roomId/messages", messageController.createMessage);

router.get("/rooms/:roomId/messages/:messageId", messageController.getSingleMessage);

router.delete("/rooms/:roomId/messages/:messageId", messageController.deleteMessage);

module.exports = router;
