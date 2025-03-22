const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const checkAdmin = async (chatId, userId) => {
    try {
        const isAdmin = await prisma.chatRoom.findFirst({
            where: {id: chatId, admin_id: userId},
            select: {id: true}
        })

        return !!isAdmin;
    }
    catch (err) {
        console.error("Error checking admin status:", err.message);
        throw err
    }
}

const getUser = async (userId) => {
    try {
        const user = await prisma.user.findFirst({
            where: {id: userId}
        });

        return user
    }
    catch (err) {
        console.error("Error checking admin status:", err.message);
        throw err
    }
}

module.exports = {
    checkAdmin,
    getUser
}