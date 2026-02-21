const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// GET all notifications for current user
router.get('/', notificationController.getNotifications);

// GET unread count (lightweight polling endpoint)
router.get('/unread-count', notificationController.getUnreadCount);

// POST mark single notification as read
router.post('/:id/read', notificationController.markRead);

// POST mark all as read
router.post('/read-all', notificationController.markAllRead);

// DELETE a notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
