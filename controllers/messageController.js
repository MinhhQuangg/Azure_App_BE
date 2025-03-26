// controllers/messageController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, userId } = req.body;
    console.log('roomId:', roomId);
    // Validate incoming data
    if (!roomId || !text || !userId) {
      return res
        .status(400)
        .json({ error: 'Missing required fields (roomId, text, userId).' });
    }

    // 1. Create the new message
    const newMessage = await prisma.message.create({
      data: {
        content: text,
        created_by: userId,
        chat_id: roomId,
      },
    });

    // 2. Update the last_message field of the room
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        last_message: text,
        updated_at: new Date(),
      },
    });

    // 3. Update read status for all users (set unread = true), except sender
    await prisma.chatRoomRead.updateMany({
      where: {
        chat_id: roomId,
        NOT: {
          user_id: userId,
        },
      },
      data: {
        unread: true,
      },
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
};
