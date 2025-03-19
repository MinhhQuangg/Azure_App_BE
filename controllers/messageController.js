const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createMessage = async (req, res) => {
  try {
    const { roomId } = req.params;    
    const { text, userId } = req.body;

    if (!roomId || !text || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required fields (roomId, text, userId)." });
    }

    const newMessage = await prisma.messages.create({
      data: {
        content: text,
        created_by: userId,
        chatroom_id: roomId,
      },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Failed to create message" });
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
