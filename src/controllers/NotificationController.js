/**
 * NOTIFICATION CONTROLLER
 * Handles fetching, marking read, and managing notifications.
 */
const Notification = require('../models/Notification');
const Borrower = require('../models/Borrower');
const { Op } = require('sequelize');

// Helper: resolve the user_id for the current request
// For borrowers, user_id in notifications is the User.id (not Borrower.id)
// because notifications are keyed to users table
const getUserId = (req) => req.user.id;

/**
 * GET /api/notifications
 * Returns notifications for the current user (paginated).
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 20, offset = 0, unread_only } = req.query;

        const where = { user_id: userId };
        if (unread_only === 'true') {
            where.is_read = false;
        }

        const { rows: notifications, count: total } = await Notification.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const unreadCount = await Notification.count({
            where: { user_id: userId, is_read: false }
        });

        res.json({
            success: true,
            notifications,
            total,
            unread_count: unreadCount
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/notifications/unread-count
 * Returns just the unread count (lightweight, for polling).
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = getUserId(req);
        const count = await Notification.count({
            where: { user_id: userId, is_read: false }
        });
        res.json({ success: true, unread_count: count });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read.
 */
exports.markRead = async (req, res) => {
    try {
        const userId = getUserId(req);
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: userId }
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.update({ is_read: true, read_at: new Date() });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user.
 */
exports.markAllRead = async (req, res) => {
    try {
        const userId = getUserId(req);
        await Notification.update(
            { is_read: true, read_at: new Date() },
            { where: { user_id: userId, is_read: false } }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification (own only).
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = getUserId(req);
        const deleted = await Notification.destroy({
            where: { id: req.params.id, user_id: userId }
        });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
