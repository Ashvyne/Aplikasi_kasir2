/**
 * LOAN MODEL
 * Mewakili transaksi peminjaman alat
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Equipment = require('./Equipment');
const Borrower = require('./Borrower');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  loan_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Nomor referensi peminjaman'
  },
  borrower_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID peminjam',
    references: {
      model: 'borrowers',
      key: 'id'
    }
  },
  equipment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID alat yang dipinjam',
    references: {
      model: 'equipment',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Jumlah unit yang dipinjam'
  },
  loan_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Tanggal peminjaman'
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Tanggal jatuh tempo pengembalian'
  },
  return_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Tanggal pengembalian aktual'
  },
  status: {
    type: DataTypes.ENUM(
      'Pending',          // Waiting for approval
      'Approved',         // Approved, ready for pickup
      'Active',           // Item with borrower
      'Overdue',          // Past due date
      'Returning',        // Returned by user, waiting for staff inspection
      'Inspecting',       // Staff is reviewing condition
      'Penalty_Pending',  // Damage found, waiting for fee settlement
      'Completed',        // Finished, returned, no more dues
      'Rejected',         // Application denied
      'Cancelled',        // Cancelled before active
      'Disetujui',        // Legacy alias for Approved
      'Ditolak',          // Legacy alias for Rejected
      'Selesai',          // Legacy alias for Completed
      'Aktif',            // Legacy alias for Active
      'Terlambat',        // Legacy alias for Overdue
      'Dibatalkan'        // Legacy alias for Cancelled
    ),
    defaultValue: 'Pending',
    comment: 'Status peminjaman'
  },
  approval_status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
    comment: 'Status persetujuan dari Petugas/Admin'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID Petugas yang menyetujui',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu persetujuan'
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alasan penolakan jika ditolak'
  },
  daily_rate: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Tarif sewa harian pada saat peminjaman'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Catatan saat peminjaman'
  },
  return_condition: {
    type: DataTypes.ENUM('Baik', 'Rusak Ringan', 'Rusak Berat', 'Hilang'),
    allowNull: true,
    comment: 'Kondisi alat saat pengembalian'
  },
  damage_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Catatan kerusakan/masalah pada pengembalian'
  },
  damage_cost: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Biaya perbaikan/kompensasi kerusakan'
  },
  rental_cost: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total biaya sewa'
  },
  is_late: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Status keterlambatan'
  },
  late_fee: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Biaya keterlambatan'
  },
  return_status: {
    type: DataTypes.ENUM('Active', 'Returned', 'Verified', 'Completed'),
    defaultValue: 'Active',
    comment: 'Status pengembalian: Active=sedang dipinjam, Returned=sudah dikembalikan pelanggan/menunggu verifikasi, Verified=sudah diverifikasi staff, Completed=selesai'
  },
  returned_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu pengembalian awal oleh customer'
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu verifikasi oleh staff'
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID staff yang melakukan verifikasi',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  grace_period_days: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Jumlah hari masa tenggang sebelum verifikasi'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID user yang membuat catatan'
  }
}, {
  tableName: 'loans',
  timestamps: true,
  comment: 'Tabel transaksi peminjaman alat'
});

// Setup associations
Loan.belongsTo(Borrower, { foreignKey: 'borrower_id', as: 'borrower' });
Loan.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' });

Borrower.hasMany(Loan, { foreignKey: 'borrower_id', as: 'loans' });
Equipment.hasMany(Loan, { foreignKey: 'equipment_id', as: 'loans' });

module.exports = Loan;
