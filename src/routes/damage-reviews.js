const express = require('express');
const router = express.Router();
const damageReviewController = require('../controllers/DamageReviewController');
const { verifyToken, requireAdminOrStaff } = require('../middleware/authMiddleware');

// Get review (User/Staff)
router.get('/loan/:loanId', verifyToken, damageReviewController.getReviewByLoanId);

// Update review (Staff only)
router.put('/:id', verifyToken, requireAdminOrStaff, damageReviewController.updateReview);

// Chat
router.get('/:id/messages', verifyToken, damageReviewController.getMessages);
router.post('/:id/messages', verifyToken, damageReviewController.sendMessage);

module.exports = router;
