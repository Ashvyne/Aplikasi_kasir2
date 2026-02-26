/**
 * NOTIFICATION MODEL
 * Stores in-app notifications for all roles
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Recipient user ID (from users table)'
    },
    type: {
        type: DataTypes.ENUM(
            'loan_approved',
            'loan_rejected',
            'loan_overdue',
            'penalty_issued',
            'penalty_adjusted',
            'penalty_cancelled',
            'new_message',
            'payment_completed',
            'return_submitted',
            'return_verified',
            'system'
        ),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Related entity: Loan, DamageReview, LoanThread'
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the related entity'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    action_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Frontend URL to navigate to when clicked'
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
        // user_id is FK and likely already indexed
        { fields: ['is_read'] },
        // { fields: ['type'] }, // Optional, can remove if still hitting limit
        { fields: ['created_at'] }
    ]
});

module.exports = Notification;
