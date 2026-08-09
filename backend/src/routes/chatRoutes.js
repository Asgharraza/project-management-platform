const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
} = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/', getChatMessages);
router.post('/', sendChatMessage);
router.delete('/:messageId', deleteChatMessage);

module.exports = router;