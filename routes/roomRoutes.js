const express = require("express");
const {
    createRoom,
    getChatRoomDetails,
    updateRoomDescription,
    requestJoin,
    approveMember,
    removeMember,
    leaveRoom,
    loadMessages,
    loadChatRooms,
    checkAdmin
} = require("../controllers/chatRoomController");

const router = express.Router();

router.post("/", createRoom);
router.post("/:chatId/request", requestJoin);

router.get("/:chatId/details", getChatRoomDetails);
router.get("/:chatroomId/messages", loadMessages);
router.get("/user/:userId", loadChatRooms);
router.get("/:chatId/admin/:userId", checkAdmin);

router.put("/:chatId/description", updateRoomDescription);
router.put("/:chatId/approve/:userId", approveMember);

router.delete("/:chatId/members/:userId", removeMember);
router.delete("/:chatId/leave/:userId", leaveRoom);


module.exports = router;
