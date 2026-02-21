/**
 * AUDIT LOG CONTROLLER
 * Admin-only endpoint for viewing the audit trail.
 */
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');

/**
 * GET /api/audit-logs
 * Returns paginated audit logs. Admin only.
 * Query params: limit, offset, action, entity_type, actor_id, from, to
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            action,
            entity_type,
            actor_id,
            from,
            to
        } = req.query;

        const where = {};
        if (action) where.action = { [Op.like]: `%${action}%` };
        if (entity_type) where.entity_type = entity_type;
        if (actor_id) where.actor_id = parseInt(actor_id);
        if (from || to) {
            where.created_at = {};
            if (from) where.created_at[Op.gte] = new Date(from);
            if (to) where.created_at[Op.lte] = new Date(to);
        }

        const { rows: logs, count: total } = await AuditLog.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({ success: true, logs, total });
    } catch (error) {
        console.error('Get Audit Logs Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/audit-logs/entity/:type/:id
 * Returns all audit logs for a specific entity (e.g. Loan #5).
 */
exports.getEntityLogs = async (req, res) => {
    try {
        const { type, id } = req.params;
        const logs = await AuditLog.findAll({
            where: { entity_type: type, entity_id: parseInt(id) },
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
