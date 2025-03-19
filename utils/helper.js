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
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    checkAdmin
}