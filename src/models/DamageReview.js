const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Loan = require('./Loan');

const DamageReview = sequelize.define('DamageReview', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    loan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'loans',
            key: 'id'
        }
    },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    final_damage_cost: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Final damage cost decided by staff'
    },
    inspection_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Staff notes on damage'
    },
    status: {
        type: DataTypes.ENUM('Waiting for Review', 'Under Inspection', 'Approved with Penalty', 'Rejected (No Damage Fee)', 'Dispute Open'),
        defaultValue: 'Waiting for Review',
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'damage_reviews',
    timestamps: true,
    underscored: true
});

// Associations
DamageReview.belongsTo(Loan, { foreignKey: 'loan_id', as: 'loan' });
Loan.hasOne(DamageReview, { foreignKey: 'loan_id', as: 'damage_review' });

module.exports = DamageReview;
