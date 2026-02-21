/**
 * AUDIT SERVICE
 * Central service for writing structured audit logs.
 * Import this anywhere in the backend to record critical actions.
 */
const AuditLog = require('../models/AuditLog');

/**
 * Write an audit log entry.
 * @param {object} opts
 * @param {object} [opts.actor] - req.user object (or null for system)
 * @param {string} opts.action - Action constant e.g. 'LOAN_APPROVED'
 * @param {string} opts.entityType - Entity type e.g. 'Loan'
 * @param {number} [opts.entityId] - Entity ID
 * @param {any} [opts.oldValue] - Previous state (will be JSON.stringified)
 * @param {any} [opts.newValue] - New state (will be JSON.stringified)
 * @param {string} [opts.description] - Human-readable description
 * @param {string} [opts.ipAddress] - IP address from req.ip
 * @param {object} [opts.metadata] - Extra metadata object
 */
const audit = async ({ actor, action, entityType, entityId, oldValue, newValue, description, ipAddress, metadata }) => {
    try {
        await AuditLog.create({
            actor_id: actor?.id || null,
            actor_role: actor?.role || 'system',
            actor_name: actor?.name || 'System',
            action,
            entity_type: entityType,
            entity_id: entityId || null,
            old_value: oldValue ? JSON.stringify(oldValue) : null,
            new_value: newValue ? JSON.stringify(newValue) : null,
            description: description || null,
            ip_address: ipAddress || null,
            metadata: metadata ? JSON.stringify(metadata) : null
        });
    } catch (err) {
        // Audit logging should never crash the main flow
        console.error('[AuditService] Failed to write audit log:', err.message);
    }
};

module.exports = { audit };
