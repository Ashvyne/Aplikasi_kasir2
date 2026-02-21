/**
 * NOTIFICATION SERVICE
 * Central service for creating and dispatching notifications.
 * Import this anywhere in the backend to trigger notifications.
 */
const Notification = require('../models/Notification');

/**
 * Create a notification for a specific user.
 * @param {object} opts
 * @param {number} opts.userId - Recipient user ID
 * @param {string} opts.type - Notification type enum
 * @param {string} opts.title - Short title
 * @param {string} opts.message - Full message body
 * @param {string} [opts.entityType] - Related entity type
 * @param {number} [opts.entityId] - Related entity ID
 * @param {string} [opts.actionUrl] - Frontend URL to navigate to
 */
const notify = async ({ userId, type, title, message, entityType, entityId, actionUrl }) => {
    try {
        await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            entity_type: entityType || null,
            entity_id: entityId || null,
            action_url: actionUrl || null,
            is_read: false
        });
    } catch (err) {
        // Notifications should never crash the main flow
        console.error('[NotificationService] Failed to create notification:', err.message);
    }
};

/**
 * Notify multiple users at once.
 */
const notifyMany = async (userIds, opts) => {
    for (const userId of userIds) {
        await notify({ ...opts, userId });
    }
};

module.exports = { notify, notifyMany };
