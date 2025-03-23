// controllers/messageController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, userId } = req.body;
    console.log("roomId:", roomId);
    // Validate incoming data
    if (!roomId || !text || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required fields (roomId, text, userId)." });
    }

    const newMessage = await prisma.message.create({
      data: {
        content: text,
        created_by: userId,
        chat_id: roomId,
      },
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({ error: "Failed to create message" });
  }
};