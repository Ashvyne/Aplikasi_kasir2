/**
 * EQUIPMENT MODEL
 * Mewakili alat/equipment yang dapat dipinjam
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nama alat/equipment'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Kode unik alat'
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'Umum',
    comment: 'Kategori alat'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Deskripsi detail alat'
  },
  acquisition_cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Biaya perolehan alat'
  },
  daily_rental_rate: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Tarif sewa harian'
  },
  condition: {
    type: DataTypes.ENUM('Baik', 'Rusak Ringan', 'Rusak Berat'),
    defaultValue: 'Baik',
    comment: 'Kondisi alat saat ini'
  },
  total_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Total jumlah unit alat'
  },
  available_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Jumlah unit yang tersedia'
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
    comment: 'URL gambar alat'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Lokasi penyimpanan alat'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Catatan tambahan tentang alat'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Status aktif/nonaktif alat'
  }
}, {
  tableName: 'equipment',
  timestamps: true,
  comment: 'Tabel data alat/equipment yang dapat dipinjam'
});

module.exports = Equipment;
