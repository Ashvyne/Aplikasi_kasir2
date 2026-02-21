const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const DamageReview = require('./DamageReview');

const DamageChatMessage = sequelize.define('DamageChatMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    review_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'damage_reviews',
            key: 'id'
        }
    },
    sender_role: {
        type: DataTypes.ENUM('user', 'staff'),
        allowNull: false
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the user or staff who sent the message'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    attachment_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL of the attached image/file'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'damage_chat_messages',
    timestamps: true,
    updatedAt: false, // Messages are not typically updated
    underscored: true
});

// Associations
DamageChatMessage.belongsTo(DamageReview, { foreignKey: 'review_id', as: 'review' });
DamageReview.hasMany(DamageChatMessage, { foreignKey: 'review_id', as: 'messages' });

module.exports = DamageChatMessage;
