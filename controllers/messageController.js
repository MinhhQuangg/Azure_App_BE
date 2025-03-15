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


async function translateText(originalText, targetLang) {
  // In real life, integrate with a translation API or your own logic.
  // This is just a placeholder returning a "mock" translated string.
  return `[${targetLang}] ${originalText}`;
}

exports.getSingleMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query; 

    if (!userId) {
      return res.status(400).json({
        error:
          "Missing userId in query parameters (required to determine preferred language).",
      });
    }

    const message = await prisma.messages.findFirst({
      where: { chatroom_id: roomId },
      orderBy: { created_at: "desc" },
    });

    if (!message) {
      return res.status(404).json({ error: "No messages found for this room." });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferred_lang: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const translatedContent = await translateText(message.content, user.preferred_lang);

    const responseMessage = {
      ...message,
      content: translatedContent,
    };

    const io = req.app.get("socketio");
    io.to(userId).emit("translatedMessage", responseMessage);

    res.json(responseMessage);
  } catch (error) {
    console.error("Error retrieving latest message:", error);
    res.status(500).json({ error: "Failed to retrieve the latest message" });
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
