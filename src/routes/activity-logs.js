const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const activityLogController = require('../controllers/activityLogController');
const router = express.Router();

// GET all activity logs (Admin only)
router.get('/', verifyToken, requireAdmin, activityLogController.getAllActivityLogs);

// GET activity summary (Admin only)
router.get('/summary/overview', verifyToken, requireAdmin, activityLogController.getActivitySummary);

// GET logs by user (Admin only)
router.get('/user/:user_id', verifyToken, requireAdmin, activityLogController.getLogsByUser);

// GET logs by entity (Admin only)
router.get('/entity/:entity_type/:entity_id', verifyToken, requireAdmin, activityLogController.getLogsByEntity);

module.exports = router;
