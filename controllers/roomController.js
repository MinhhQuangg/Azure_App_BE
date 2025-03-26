const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const MemberStatus = require('../utils/room');
const { checkAdmin, getUser } = require('../utils/helper');

// create chat room by admin_id
const createRoom = async (req, res) => {
    try {
        const { name, description, adminId, avatarColor, avatarText, lastMessage } = req.body;

        if (!adminId) {
            return res.status(400).json({ error: "admin_id is required."})
        }

        if (!name) {
            return res.status(400).json({ error: "Chat room name is required."})
        }

        if (!avatarColor || !avatarText) {
            return res.status(400).json({ error: "Chat room avatar color and text is required."})
        }

        const id = uuidv4();

        const chatroom = await prisma.chatRoom.create({
            data: {
                id,
                name,
                description,
                admin_id: adminId,
                created_at: new Date(),
                updated_at: new Date(),
                avatar_color: avatarColor,
                avatar_text: avatarText,
                last_message: lastMessage
            }
        });

        await prisma.chatRoomMember.create({
            data: {
                user_id: adminId,
                chat_id: id,
                status: MemberStatus.APPROVED
            }
        });

        await prisma.chatRoomRead.create({
            data: {
                user_id: adminId,
                chat_id: id,
                unread: true
            }
        })
        
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
                avatar_color: true,
                avatar_text: true,
                last_message: true,
                created_at: true,
                updated_at: true,
                members: {
                    select: {
                        timestamp: true,
                        status: true,
                        user: {
                            select: {
                            id: true,
                            given_name: true,
                            profile_picture: true,
                            email: true
                            }
                        }
                    }
                }
            }
        });
  
	if (!chatRoom) {
		return res.status(404).json({ error: "Chat room not found" });
	}

	const formattedMembers = chatRoom.members.map(member => ({
		id: member.user.id,
		given_name: member.user.given_name,
		profile_picture: member.user.profile_picture,
		status: member.status,
        timestamp: member.timestamp
	}));

	return res.json({
		chatRoom: {
			...chatRoom,
			members: formattedMembers
		}
	});
  
    } catch (err) {
      console.error("Error fetching chat room details:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };  

// update chat room's description
const updateRoomData = async (req, res) => {
    try {
        const { chatId } = req.params;
        const data = req.body;

        const chatroom = await prisma.chatRoom.update({
            where: { id: chatId },
            data: { 
                ...data,
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

        const requested = await prisma.chatRoomMember.findFirst({
            where: { 
                user_id: userId,
                chat_id: chatId,
                status: MemberStatus.PENDING
            }
        })

        if (requested == null) {
            await prisma.chatRoomMember.create({
                data: { 
                    user_id: userId,
                    chat_id: chatId,
                    status: MemberStatus.PENDING
                }
            })
            return res.json({ message: "Join request sent from " + userId })
        }
        return res.json({ message: userId + " already sent request to join."})
    }
    catch (err) {
        console.error("Error requesting to join:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// admin approve member
const handleMemberRequest = async (req, res) => {
    try {
        const { chatId  } = req.params;
        const { userId, status } = req.body;
        
        if (!checkAdmin(chatId, userId)) {
            return res.status(400).json({ message: "Only admin can approve member." })
        }

        if (status == MemberStatus.REJECTED) {
            await prisma.chatRoomMember.delete({
                where: { 
                    user_id_chat_id: {
                        chat_id: chatId, 
                        user_id: userId
                    }
                },
            })
        }
        else {
            await prisma.chatRoomMember.update({
                where: { 
                    user_id_chat_id: {
                        chat_id: chatId, 
                        user_id: userId
                    }
                },
                data: { 
                    status: status,
                    timestamp: new Date()
                }
            })

            await prisma.chatRoomRead.create({
                data: {
                    user_id: userId,
                    chat_id: chatId,
                    unread: true
                }
            })
        }

        return res.json({ message: "Member approved " + userId })
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
                user_id_chat_id: {
                    chat_id: chatId, 
                    user_id: userId 
                }
            }
        });

        return res.json({ message: userId + " has been removed from chat room"})
    }
    catch (err) {
        console.error("Error removing member:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// leave room (if admin vs if members)
const leaveRoom = async (req, res) => {
    try {
        const { chatId, userId } = req.params;

        if (checkAdmin(chatId, userId)) {
            const newAdmin = await prisma.chatRoomMember.findFirst({
                where: { 
                    chat_id: chatId,
                    user_id: {
                        not: userId
                    },
                    status: MemberStatus.APPROVED
                },
                select: { user_id: true },
                orderBy: { user_id: "asc" } 
            });

            if (newAdmin) {
                // assign new admin
                await prisma.chatRoom.update({
                    where: { id: chatId },
                    data: { admin_id: newAdmin.user_id }
                });

                // leave room
                await prisma.chatRoomMember.delete({
                    where: { 
                        user_id_chat_id: { 
                            chat_id: chatId, 
                            user_id: userId 
                        } 
                    }
                });

                await prisma.chatRoomRead.delete({
                    where: { 
                        user_id_chat_id: { 
                            chat_id: chatId, 
                            user_id: userId 
                        } 
                    }
                });

            } 
            else {
                // no members left -> delete the chat room
                const a = await prisma.chatRoom.findMany({
                    where: { id: chatId, admin_id: userId },
                });
                await prisma.chatRoom.delete({ where: { id: chatId } });
            }
        }
        return res.json({ message: userId + " has left the chat room"});
    }
    catch (err) {
        console.error("Error leaving room:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getReadStatus = async (req, res) => {
    try {
        const { chatId, userId } = req.params;

        const response = await prisma.chatRoomRead.findFirst({
            where: {
                chat_id: chatId, 
                user_id: userId 
            }
        });
        return res.json({ message: "Chat room read status updated successfully", unread: response?.unread})
    }
    catch (err) {
        console.error("Error loading messages:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const updateReadStatus = async (req, res) => {
    try {
        const { chatId, userId } = req.params;

        await prisma.chatRoomRead.updateMany({
            where: { 
                chat_id: chatId, 
                user_id: userId
            },
            data: { unread: false }
        });
        return res.json({message: "Chat room read status updated."})
    }
    catch (err) {
        console.error("Error loading messages:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const loadMessages = async (req, res) => {
    try {
        const { chatroomId } = req.params;
        const cursor = req.query.cursor || null;
        const limit = 20;

        console.log(cursor)
    
        const messages = await prisma.message.findMany({
            where: { chat_id: chatroomId },
            orderBy: { created_at: "desc" },
            take: limit,
            ...(cursor && {
            skip: 1,
            cursor: { id: cursor },
            }),
            include: {
            sender: {
                select: {
                given_name: true,
                profile_picture: true,
                },
            },
            },
        });
    
        const oldest = await prisma.message.findFirst({
            where: { chat_id: chatroomId },
            orderBy: { created_at: "asc" },
            select: { id: true },
        });
    
        console.log(messages)
        const hasMore = oldest && !messages.some((msg) => msg.id === oldest?.id);
        
        return res.json({
            messages: messages.reverse(),
            cursor: hasMore ? messages[0]?.id : null,
            hasMore,
        });
    } catch (err) {
      console.error("Error loading messages:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
};


// load latest chat rooms for user
const loadChatRooms = async (req, res) => {
    try {
        const { userId } = req.params;
        const cursor = req.query.cursor || null;
        const limit = 10;

        // fetch chat rooms where user is an "approved" member
        const chatRooms = await prisma.chatRoomMember.findMany({
            where: { 
                user_id: userId, 
                status: MemberStatus.APPROVED
            },
            take: limit,
            cursor: cursor ? { chat_id: cursor, user_id: userId } : undefined, // Cursor for pagination
            orderBy: { chatRoom: { updated_at: "desc" } }, // Sort by latest chat room update
            include: {
                chatRoom: {
                    include: {
                        messages: {
                            take: 1, // Fetch only the latest message
                            orderBy: { created_at: "asc" }, // Get the most recent message
                            select: {
                                content: true, 
                                created_at: true,
                                sender: { select: { given_name: true, profile_picture: true } }
                            }
                        }
                    }
                }
            }
        });

        // Get last chat room ID for next request
        const nextCursor = chatRooms.length === limit ? chatRooms[chatRooms.length - 1].id : null;

        return res.json({
            chatRooms: chatRooms,
            cursor: nextCursor, // Use this cursor for next request
            hasMore: !!nextCursor
        });

    } catch (err) {
        console.error("Error loading chat rooms:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const getMembers = async (req, res) => {
    try {
        const { chatId } = req.params;
        const memsChat = await prisma.chatRoomMember.findMany({
            where: { 
                chat_id: chatId,
                status: MemberStatus.APPROVED
             }
        });

        const members = await Promise.all(
            memsChat.map((mem) => getUser(mem.user_id))
        );          
        
        return res.json({message: "Get chat room members successfully.", members})
    }
    catch (err) {
        console.error("Error loading chat rooms:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const getPendingMembers = async (req, res) => {
    try {
        const { chatId } = req.params;
        const memsChat = await prisma.chatRoomMember.findMany({
            where: { 
                chat_id: chatId,
                status: MemberStatus.PENDING
            }
        });

        const members = await Promise.all(
            memsChat.map((mem) => getUser(mem.user_id))
        );          
        
        return res.json({message: "Get chat room pending members successfully.", members})
    }
    catch (err) {
        console.error("Error loading chat rooms:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

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

const changeAdmin = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { newAdminId } = req.body;

        await prisma.chatRoom.updateMany({
            where: {
                id: chatId
            },
            data: {
                admin_id: newAdminId
            }
        })
        return res.json({message: "Change admin successfully."})
    }
    catch (err) {
        console.error("Failed to change new admin:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const isMember = async (req, res) => {
    try {
        const { chatId, userId } = req.params;
        const findMem = await prisma.chatRoomMember.findFirst({
            where: {
                chat_id: chatId,
                user_id: userId,
                status: 'approved'
            }
        });

        console.log(findMem)
          
        return res.json({isMember: findMem != null, chatroom: findMem})
    }
    catch (err) {
        console.error("Failed to check member status:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const getPendingRooms = async (req, res) => {
    const { userId } = req.params;
  
    try {
        const pendingRooms = await prisma.chatRoomMember.findMany({
            where: {
            user_id: userId,
            status: "pending",
            },
            include: {
            chatRoom: true, // include chat room details
            },
        });
    
        const sortedRooms = pendingRooms
            .filter(r => r.chatRoom) // ensure chatRoom exists
            .sort((a, b) => new Date(b.chatRoom.updated_at) - new Date(a.chatRoom.updated_at));

        const rooms = sortedRooms.map((entry) => entry.chatRoom);
  
      return res.json({ pendingRooms: rooms });
    } catch (err) {
      console.error("Error fetching pending rooms:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  

module.exports = { 
    createRoom,
    requestJoin,
    getChatRoomDetails,
    loadMessages,
    loadChatRooms,
    isAdmin,
    updateRoomData,
    handleMemberRequest,
    removeMember,
    leaveRoom,
    getReadStatus,
    updateReadStatus,
    getMembers,
    getPendingMembers,
    changeAdmin,
    isMember,
    getPendingRooms
}