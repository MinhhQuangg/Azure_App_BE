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
    isAdmin
} = require("../controllers/roomController");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "test chat room ok" });
})


router.get("/:chatId/details", getChatRoomDetails);
router.get("/:chatId/messages", loadMessages);
router.get("/user/:userId", loadChatRooms);
router.get("/:chatId/admin/:userId", isAdmin);

router.post("/", createRoom);
router.post("/:chatId/request", requestJoin);

router.put("/:chatId/description", updateRoomDescription);
router.put("/:chatId/approve/:userId", approveMember);

router.delete("/:chatId/members/:userId", removeMember);
router.delete("/:chatId/leave/:userId", leaveRoom);


module.exports = router;
