/**
 * Chat Routes
 * /api/chat/*
 */

const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getConversations, editMessage, deleteMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/conversation/:otherId', getConversation);
router.patch('/:id', editMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
