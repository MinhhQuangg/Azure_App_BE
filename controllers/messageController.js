// controllers/messageController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getMessagesForRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await prisma.messages.findMany({
      where: { chatroom_id: roomId },
      orderBy: { created_at: "asc" },
    });
    res.json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
};


exports.createMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    const userId = req.body.userId || "some-user-id";

    const newMessage = await prisma.messages.create({
      data: {
        content: text,
        created_by: userId,
        chatroom_id: roomId,
      },
    });

    const io = req.app.get("socketio");

    io.to(roomId).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
};

exports.getSingleMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const message = await prisma.messages.findFirst({
      where: {
        id: messageId,
        chatroom_id: roomId,
      },
    });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
  } catch (error) {
    console.error("Error retrieving single message:", error);
    res.status(500).json({ error: "Failed to retrieve message" });
  }
};


exports.deleteMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;

    await prisma.messages.deleteMany({
      where: {
        id: messageId,
        chatroom_id: roomId,
      },
    });

    const io = req.app.get("socketio");
    io.to(roomId).emit("messageDeleted", { messageId });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
