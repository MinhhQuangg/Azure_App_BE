const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const MemberStatus = require('../utils/room');
const { checkAdmin } = require('../utils/helper');

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

        await prisma.chatRoomMember.create({
            data: {
                user_id: adminId,
                chatId: id,
                status: MemberStatus.APPROVED
            }
        });
        
        return res.status(201).json({ message: "Chat room created successfully.", chatroom });
    }
    catch (err) {
        console.error("Error creating chat room: ", err.message);
        return res.status(500).json({ error: "Internal server error."});
    }
}

// get chat room details
const getChatRoomDetails = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chatRoom = await prisma.chatRoom.findUnique({
            where: { id: chatId },
            select: {
                id: true,
                name: true,
                description: true,
                admin_id: true,
                members: {
                    select: {
                        user: {
                            select: { id: true, given_name: true, last_name: true, profile_picture: true }
                        }
                    }
                }
            }
        });

        if (!chatRoom) {
            return res.status(404).json({ error: "Chat room not found" });
        }

        res.json({ chatRoom });

    } catch (err) {
        console.error("Error fetching chat room details:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

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
        const { chatId , userId } = req.params;
        
        if (!checkAdmin(chatId, userId)) {
            return res.status(400).json({ message: "Only admin can approve member." })
        }

        await prisma.chatRoomMember.update({
            where: { 
                chat_id_user_id: {
                    chat_id: chatId, 
                    user_id: userId
                }
            },
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
        const { chatId, userId } = req.params;

        if (!checkAdmin(chatId, userId)) {
            return res.status(400).json({ message: "Only admin can remove member." })
        }

        await prisma.chatRoomMember.delete({
            where: {
                chat_id_user_id: {
                    chat_id: chatId, 
                    user_id: userId 
                }
            }
        });

        return res.json({ message: userId + " has been removed from chat room"})
    }
    catch (err) {
        console.error("Error removing member:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

// leave room (if admin vs if members)
const leaveRoom = async (req, res) => {
    try {
        const { chatId, userId } = req.params;

        if (checkAdmin(chatId, userId)) {
            const newAdmin = await prisma.chatRoomMember.findFirst({
                where: { chat_id: chatId },
                select: { user_id: true },
                orderBy: { user_id: "asc" } // find first available member
            });

            if (newAdmin) {
                // assign new admin
                await prisma.chatRoom.update({
                    where: { id: chatId },
                    data: { admin_id: newAdmin.user_id }
                });
            } 
            else {
                // no members left -> delete the chat room
                await prisma.chatRoom.delete({ where: { id: chatId } });
            }
        }
        
        // leave room
        await prisma.chatRoomMember.delete({
            where: { 
                chat_id_user_id: { 
                    chat_id: chatId, 
                    user_id: userId 
                } 
            }
        });

        return res.json({ message: userId + " has left the chat room"});
    }
    catch (err) {
        console.error("Error leaving room:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

// load message for chat room
const loadMessages = async (req, res) => {
    try {
        const { chatroomId, userId } = req.params;
        const cursor = req.query.cursor || null; // the last loaded message ID (for pagination)
        const limit = 20; // max 20 messages per request

        const messages = await prisma.message.findMany({
            where: { chatroom_id: chatroomId },
            orderBy: { created_at: "asc" }, 
            take: limit,
            cursor: cursor ? { id: cursor } : undefined,
            include: {
                sender: { select: { given_name: true, last_name: true, profile_picture: true } }
            }
        });

        // get last message ID to use as cursor for next request
        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

        res.json({
            messages,
            cursor: nextCursor,
            hasMore: !!nextCursor
        });

    } catch (err) {
        console.error("Error loading messages:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// load latest chat rooms for user
const loadChatRooms = async (req, res) => {
    try {
        const { userId } = req.params;
        const cursor = req.query.cursor || null;
        const limit = 10;

        console.log("User ID:", userId);

        // fetch chat rooms where user is an "approved" member
        const chatRooms = await prisma.chatRoomMember.findMany({
            where: { 
                user_id: userId, 
                status: MemberStatus.APPROVED
            },
            take: limit,
            cursor: cursor ? { chat_id: cursor, user_id: userId } : undefined, // Cursor for pagination
            orderBy: { chatRoom: { updated_at: "asc" } }, // Sort by latest chat room update
            include: {
                chatRoom: {
                    include: {
                        messages: {
                            take: 1, // Fetch only the latest message
                            orderBy: { created_at: "asc" }, // Get the most recent message
                            select: {
                                content: true, 
                                created_at: true,
                                sender: { select: { given_name: true, last_name: true, profile_picture: true } }
                            }
                        }
                    }
                }
            }
        });

        // Get last chat room ID for next request
        const nextCursor = chatRooms.length === limit ? chatRooms[chatRooms.length - 1].id : null;

        res.json({
            chatRooms: chatRooms,
            cursor: nextCursor, // Use this cursor for next request
            hasMore: !!nextCursor
        });

    } catch (err) {
        console.error("Error loading chat rooms:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


// check if admin of chat room
const isAdmin = async (req, res) => {
    try {
        const { chatId , userId } = req.params;
        const isAd = await checkAdmin(chatId, userId);

        return res.json({ isAdmin: isAd })
    }
    catch (err) {
        console.error("Error checking admin status:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = { 
    createRoom,
    requestJoin,
    getChatRoomDetails,
    loadMessages,
    loadChatRooms,
    isAdmin,
    updateRoomDescription,
    approveMember,
    removeMember,
    leaveRoom
}