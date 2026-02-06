/**
 * USER MODEL
 * Mewakili user/admin sistem
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nama lengkap user'
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true,
    comment: 'Username untuk login'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Email user'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Password terenkripsi'
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'staff', 'cashier', 'supervisor', 'borrower'),
    defaultValue: 'borrower',
    comment: 'Role user - admin/manager/staff/cashier/supervisor/borrower'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Status aktif user'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu login terakhir'
  }
}, {
  tableName: 'users',
  timestamps: true,
  comment: 'Tabel data user/admin sistem'
});

module.exports = User;
