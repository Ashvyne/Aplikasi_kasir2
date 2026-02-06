const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, requireAdminOrPetugasOrStaff } = require('../middleware/authMiddleware');
const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// GET dashboard summary (Admin only)
router.get('/summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const activeLoans = await Loan.count({ where: { status: 'Aktif' } });
    const totalEquipment = await Equipment.count({ where: { is_active: true } });
    const totalBorrowers = await Borrower.count({ where: { is_active: true } });
    const lateLoans = await Loan.count({ where: { is_late: true } });
    
    res.json({
      success: true,
      activeLoans,
      totalEquipment,
      totalBorrowers,
      lateLoans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET staff dashboard summary (Staff, Petugas, Admin)
router.get('/staff', verifyToken, requireAdminOrPetugasOrStaff, async (req, res) => {
  try {
    const activeLoans = await Loan.count({ where: { status: 'Aktif' } });
    const pendingApprovals = await Loan.count({ where: { approval_status: 'Pending' } });
    const totalEquipment = await Equipment.count({ where: { is_active: true } });
    const lateLoans = await Loan.count({ where: { is_late: true, status: 'Aktif' } });
    const completedToday = await Loan.count({ 
      where: { 
        status: 'Selesai',
        return_date: {
          [Op.eq]: sequelize.where(
            sequelize.fn('DATE', sequelize.col('return_date')), 
            Op.eq, 
            new Date().toISOString().split('T')[0]
          )
        }
      } 
    });
    
    // Get equipment condition summary
    const equipment = await Equipment.findAll({
      where: { is_active: true },
      attributes: ['condition']
    });
    
    const conditionSummary = {
      good: equipment.filter(e => e.condition === 'Baik').length,
      minorDamage: equipment.filter(e => e.condition === 'Rusak Ringan').length,
      moderateDamage: equipment.filter(e => e.condition === 'Rusak Sedang').length,
      severeDamage: equipment.filter(e => e.condition === 'Rusak Berat').length,
      unusable: equipment.filter(e => e.condition === 'Tidak Layak').length
    };
    
    res.json({
      success: true,
      menu: {
        equipment: {
          name: 'Data Alat',
          description: 'Kelola dan lihat data alat',
          icon: 'tools'
        },
        loans: {
          name: 'Peminjaman',
          description: 'Kelola peminjaman dan persetujuan',
          icon: 'document'
        },
        returns: {
          name: 'Pengembalian',
          description: 'Proses pengembalian alat',
          icon: 'undo'
        },
        reports: {
          name: 'Laporan',
          description: 'Lihat laporan peminjaman dan kondisi alat',
          icon: 'chart'
        }
      },
      summary: {
        activeLoans,
        pendingApprovals,
        totalEquipment,
        lateLoans,
        completedToday,
        conditionSummary
      }
    });
  } catch (error) {
    console.error('❌ Error getting staff dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
