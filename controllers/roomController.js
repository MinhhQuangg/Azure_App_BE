const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const MemberStatus = require('../utils/room');
const { raw } = require("@prisma/client/runtime/library");

// create chat room by admin_id
const createRoom = async (req, res) => {
    try {
        const { name, description, adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({ error: "admin_id is required."})
        }

        if (!name) {
            return res.status(400).json({ error: "Chat room name is required."})
        }

        const id = uuidv4();

        const chatroom = await prisma.chatRoom.create({
            data: {
                id,
                name,
                description,
                admin_id: adminId,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        
        return res.status(201).json({ message: "Chat room created successfully.", chatroom });
    }
    catch (err) {
        console.error("Error creating chat room: ", err.message);
        return res.status(500).json({ error: "Internal server error."});
    }
}


// delete chat room by id
const deleteRoom = async (req, res) => {
    try {
        const { chatId } = req.params;

        await prisma.chatRoom.delete({
            where: { id: chatId }
        });

        res.json({ message: "Chat room deleted successfully." })
    }
    catch (err) {
        console.error("Error deleting chat room: ", err.message);
        return res.status(500).json({ error: "Internal server error."});
    }
}

// update chat room's description
const updateRoomDescription = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { description } = req.body;

        const chatroom = await prisma.chatRoom.update({
            where: { id: chatId },
            data: { 
                description: description,
                updated_at: new Date()
            }
        });

        return res.json({ message: "Chat room's description updated successfully.", chatroom})

    }
    catch (err) {
        console.error("Error updating description:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// member request join
const requestJoin = async (req, res) => {
    try {
        const { chatId } =  req.params;
        const { userId } = req.body;

        await prisma.chatRoomMember.create({
            data: { 
                user_id: userId,
                chat_id: chatId,
                status: MemberStatus.PENDING
            }
        })

        return res.json({ message: "Join request sent to " + userId })
    }
    catch (err) {
        console.error("Error requesting to join:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// admin approve member
const approveMember = async (req, res) => {
    try {
        const { chatId , userId} = req.params;

        await prisma.chatRoomMember.update({
            where: { chat_id: chatId, user_id: userId },
            data: { status: MemberStatus.APPROVED }
        })
    }
    catch (err) {
        console.error("Error requesting to join:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// remove member
const removeMember = async (req, res) => {
    try {
        const {}
    }
    catch
}

// leave room (if admin vs if members)

// load message (index)

// load chat rooms by most last message sent time


// check if admin of chat room
const isAdmin = async (chatId, userId) => {
    try {

        const isAdmin = await prisma.chatRoom.findFirst({
            where: {id: chatId, admin_id: userId},
            select: {id: true}
        })

        if (isAdmin) {
            return res.json({isAdmin: true});
        }
        else {
            return res.json({isAdmin: false});
        }
    }
    catch (err) {
        console.error("Error checking admin status:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}