/**
 * AUDIT LOG MODEL
 * Structured audit trail for all critical system actions
 * Replaces the old ActivityLog factory pattern with a direct Sequelize model
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    actor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the user who performed the action',
        references: { model: 'users', key: 'id' }
    },
    actor_role: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'Role of the actor at time of action'
    },
    actor_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Snapshot of actor name at time of action'
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Action performed: LOAN_APPROVED, PENALTY_ISSUED, STATUS_CHANGED, etc.'
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Entity type: Loan, DamageReview, User, Equipment'
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the affected entity'
    },
    old_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON snapshot of the value before change'
    },
    new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON snapshot of the value after change'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Human-readable description of the action'
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional JSON metadata'
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
        { fields: ['actor_id'] },
        { fields: ['action'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['created_at'] }
    ]
});

module.exports = AuditLog;
