const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, requireAdminOrPetugasOrStaff } = require('../middleware/authMiddleware');
const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// GET reports dashboard (Admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log(' GET /api/reports');
    
    const totalLoans = await Loan.count({ where: { is_active: true } });
    const completedLoans = await Loan.count({ where: { status: 'Selesai' } });
    const lateLoans = await Loan.count({ where: { is_late: true } });
    const totalEquipment = await Equipment.count({ where: { is_active: true } });
    const totalBorrowers = await Borrower.count({ where: { is_active: true } });
    
    res.json({ 
      success: true,
      summary: {
        active_loans: totalLoans,
        completed_loans: completedLoans,
        late_loans: lateLoans,
        total_equipment: totalEquipment,
        total_borrowers: totalBorrowers
      }
    });
  } catch (error) {
    console.error(' Error getting reports:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// GET loan report (Admin, Staff, Petugas - laporan peminjaman)
router.get('/loans', verifyToken, requireAdminOrPetugasOrStaff, async (req, res) => {
  try {
    console.log(' GET /api/reports/loans - Loan Report');
    
    const loans = await Loan.findAll({
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['loan_date', 'DESC']]
    });
    
    const activeLoans = loans.filter(l => l.status === 'Aktif').length;
    const completedLoans = loans.filter(l => l.status === 'Selesai').length;
    const lateLoans = loans.filter(l => l.is_late).length;
    const pendingApprovals = loans.filter(l => l.approval_status === 'Pending').length;
    
    res.json({ 
      success: true,
      summary: {
        total_loans: loans.length,
        active_loans: activeLoans,
        completed_loans: completedLoans,
        late_loans: lateLoans,
        pending_approvals: pendingApprovals
      },
      loans
    });
  } catch (error) {
    console.error(' Error getting loan report:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// GET equipment report (Admin, Staff - status kondisi alat)
router.get('/equipment', verifyToken, requireAdminOrPetugasOrStaff, async (req, res) => {
  try {
    console.log(' GET /api/reports/equipment - Equipment Report');
    
    const equipment = await Equipment.findAll({
      where: { is_active: true },
      order: [['condition', 'DESC']]
    });
    
    const goodCondition = equipment.filter(e => e.condition === 'Baik').length;
    const minorDamage = equipment.filter(e => e.condition === 'Rusak Ringan').length;
    const moderateDamage = equipment.filter(e => e.condition === 'Rusak Sedang').length;
    const severeDamage = equipment.filter(e => e.condition === 'Rusak Berat').length;
    const unusable = equipment.filter(e => e.condition === 'Tidak Layak').length;
    
    res.json({ 
      success: true,
      summary: {
        total_equipment: equipment.length,
        good_condition: goodCondition,
        minor_damage: minorDamage,
        moderate_damage: moderateDamage,
        severe_damage: severeDamage,
        unusable: unusable
      },
      equipment
    });
  } catch (error) {
    console.error(' Error getting equipment report:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

module.exports = router;
