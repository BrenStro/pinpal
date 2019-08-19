const express = require("express");
const router = express.Router();

const conversationController = require("../controllers/conversationController");

router.get("/:conversationId", conversationController.conversation_get);

router.post("/:conversationId/send", conversationController.conversation_send_post);

module.exports = router;
