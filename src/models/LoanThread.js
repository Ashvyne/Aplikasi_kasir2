const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Borrower = require('./Borrower');
const User = require('./User');
const Loan = require('./Loan');

const LoanThread = sequelize.define('LoanThread', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    loan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'loans',
            key: 'id'
        }
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'borrowers',
            key: 'id'
        }
    },
    assigned_staff_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('Open', 'Under Review', 'Awaiting Customer Response', 'Awaiting Staff Response', 'Resolved', 'Closed'),
        defaultValue: 'Open'
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High'),
        defaultValue: 'Medium'
    },
    last_message_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    closed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'loan_threads',
    timestamps: true,
    underscored: true
});

// Associations
LoanThread.belongsTo(Loan, { foreignKey: 'loan_id', as: 'loan' });
LoanThread.belongsTo(Borrower, { foreignKey: 'customer_id', as: 'customer' });
LoanThread.belongsTo(User, { foreignKey: 'assigned_staff_id', as: 'staff' });
Loan.hasOne(LoanThread, { foreignKey: 'loan_id', as: 'thread' });

module.exports = LoanThread;
