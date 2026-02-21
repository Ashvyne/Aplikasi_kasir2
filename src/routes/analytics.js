const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/AnalyticsController');
const { verifyToken, requireAdmin, requireAdminOrStaff } = require('../middleware/authMiddleware');

// GET admin analytics
router.get('/admin', verifyToken, requireAdmin, analyticsController.getAdminStats);

// GET staff analytics
router.get('/staff', verifyToken, requireAdminOrStaff, analyticsController.getStaffStats);

module.exports = router;
