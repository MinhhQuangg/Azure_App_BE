// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/rooms/:roomId/messages", messageController.createMessage);

module.exports = router;