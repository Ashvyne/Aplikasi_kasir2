const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const LoanThread = require('./LoanThread');

const LoanThreadMessage = sequelize.define('LoanThreadMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    thread_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'loan_threads',
            key: 'id'
        }
    },
    sender_role: {
        type: DataTypes.ENUM('customer', 'staff', 'system'),
        allowNull: false
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of sender (Borrower or User), null if system'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    message_type: {
        type: DataTypes.ENUM('text', 'image', 'file', 'system', 'internal_note'),
        defaultValue: 'text'
    },
    attachment_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'loan_thread_messages',
    timestamps: true,
    updatedAt: false,
    underscored: true
});

// Associations
LoanThreadMessage.belongsTo(LoanThread, { foreignKey: 'thread_id', as: 'thread' });
LoanThread.hasMany(LoanThreadMessage, { foreignKey: 'thread_id', as: 'messages' });

module.exports = LoanThreadMessage;
