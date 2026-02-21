const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/AuditLogController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// All audit log routes are Admin only
router.use(verifyToken, requireAdmin);

// GET paginated audit logs with filters
router.get('/', auditLogController.getAuditLogs);

// GET logs for a specific entity
router.get('/entity/:type/:id', auditLogController.getEntityLogs);

module.exports = router;
