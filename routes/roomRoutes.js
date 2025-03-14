const express = require("express");
const {
    createRoom,
    getAllChatRooms,
    getChatRoomDetails,
    updateRoomDescription,
    requestJoin,
    approveMember,
    removeMember,
    leaveRoom,
    loadMessages,
    loadChatRooms,
    checkAdmin
} = require("../controllers/roomController");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "test chat room ok" });
});

// f2d42739-ff11-4e65-ba88-e1f4599da40c

router.get("/all", getAllChatRooms);
router.get("/:chatId/details", getChatRoomDetails);
router.get("/:chatId/messages", loadMessages);
router.get("/user/:userId", loadChatRooms);
router.get("/:chatId/admin/:userId", checkAdmin);

router.post("/", createRoom);
router.post("/:chatId/request", requestJoin);

router.put("/:chatId/description", updateRoomDescription);
router.put("/:chatId/approve/:userId", approveMember);

router.delete("/:chatId/members/:userId", removeMember);
router.delete("/:chatId/leave/:userId", leaveRoom);


module.exports = router;
