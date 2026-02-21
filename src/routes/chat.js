const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get Thread by Loan ID
router.get('/loan/:loan_id', verifyToken, chatController.getThreadByLoanId);

// Get Messages
router.get('/:thread_id/messages', verifyToken, chatController.getMessages);

// Send Message
router.post('/:thread_id/messages', verifyToken, chatController.sendMessage);

// Mark Read
router.post('/:thread_id/read', verifyToken, chatController.markRead);

module.exports = router;
