/**
 * BORROWER MODEL
 * Mewakili orang/entitas yang meminjam alat
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Borrower = sequelize.define('Borrower', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nama lengkap peminjam'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'Email peminjam'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Nomor telepon peminjam'
  },
  identity_type: {
    type: DataTypes.ENUM('KTP', 'SIM', 'Pasport', 'Identitas Lainnya'),
    defaultValue: 'KTP',
    comment: 'Jenis identitas'
  },
  identity_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nomor identitas'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alamat peminjam'
  },
  organization: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Organisasi/Perusahaan asal peminjam'
  },
  contact_person: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nama orang yang dapat dihubungi'
  },
  contact_person_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Nomor telepon orang yang dapat dihubungi'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Status verifikasi peminjam'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Status aktif/nonaktif peminjam'
  }
}, {
  tableName: 'borrowers',
  timestamps: true,
  comment: 'Tabel data peminjam alat'
});

module.exports = Borrower;
