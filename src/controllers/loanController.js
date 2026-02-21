/**
 * LOAN CONTROLLER
 * Mengelola operasi peminjaman dan pengembalian alat
 */

const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');
const DamageReview = require('../models/DamageReview');
const LoanThread = require('../models/LoanThread');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const { notify } = require('../services/NotificationService');
const { audit } = require('../services/AuditService');

// Helper: find the User.id for a borrower (for notifications)
const getUserIdForBorrower = async (borrowerId) => {
  try {
    const borrower = await Borrower.findByPk(borrowerId);
    if (!borrower || !borrower.email) return null;
    const user = await User.findOne({ where: { email: borrower.email } });
    return user ? user.id : null;
  } catch { return null; }
};

// GENERATE unique loan number
const generateLoanNumber = async () => {
  const lastLoan = await Loan.findOne({
    order: [['id', 'DESC']],
    attributes: ['loan_number']
  });

  let nextNumber = 1001;
  if (lastLoan && lastLoan.loan_number) {
    const lastNumber = parseInt(lastLoan.loan_number.replace('PJM-', ''));
    nextNumber = lastNumber + 1;
  }

  return `PJM-${nextNumber}`;
};

// GET all loans
exports.getAllLoans = async (req, res) => {
  try {
    console.log('✓ GET /api/loans');
    const loans = await Loan.findAll({
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' },
        { model: LoanThread, as: 'thread' }
      ],
      order: [['loan_date', 'DESC']]
    });
    res.json({
      success: true,
      loans: loans,
      count: loans.length
    });
  } catch (error) {
    console.error('❌ Error getting loans:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET active loans only
exports.getActiveLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { status: 'Aktif' },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' },
        { model: LoanThread, as: 'thread' }
      ],
      order: [['due_date', 'ASC']]
    });
    res.json({
      success: true,
      loans: loans,
      count: loans.length
    });
  } catch (error) {
    console.error('❌ Error getting active loans:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET single loan by ID
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ]
    });
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }
    res.json({ success: true, loan });
  } catch (error) {
    console.error('❌ Error getting loan:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// CREATE new loan
exports.createLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      borrower_id, equipment_id, quantity, loan_date, due_date, notes, created_by
    } = req.body;

    // Auto-detect borrower_id if missing (for self-service loan requests)
    let finalBorrowerId = borrower_id;
    if (!finalBorrowerId && req.user && req.user.email) {
      const borrowerProfile = await Borrower.findOne({ where: { email: req.user.email } }, { transaction });
      if (borrowerProfile) {
        finalBorrowerId = borrowerProfile.id;
      }
    }

    // Validasi input
    if (!finalBorrowerId || !equipment_id || !loan_date || !due_date) {
      return res.status(400).json({
        success: false,
        error: 'Data tidak lengkap. Diperlukan: borrower_id, equipment_id, loan_date, due_date'
      });
    }

    // Cek peminjam exists
    const borrower = await Borrower.findByPk(finalBorrowerId, { transaction });
    if (!borrower) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Peminjam tidak ditemukan' });
    }

    // Cek alat exists
    const equipment = await Equipment.findByPk(equipment_id, { transaction });
    if (!equipment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Alat tidak ditemukan' });
    }

    // Cek ketersediaan alat
    const qty = parseInt(quantity) || 1;
    if (equipment.available_quantity < qty) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Alat tidak tersedia. Tersedia: ${equipment.available_quantity}, Diminta: ${qty}`
      });
    }

    // Generate loan number
    const loanNumber = await generateLoanNumber();

    // Create loan
    const loan = await Loan.create({
      loan_number: loanNumber,
      borrower_id: finalBorrowerId,
      equipment_id,
      quantity: qty,
      loan_date,
      due_date,
      daily_rate: equipment.daily_rental_rate,
      notes: notes || null,
      created_by: created_by || null,
      status: 'Aktif'
    }, { transaction });

    // Update equipment availability
    const newAvailable = equipment.available_quantity - qty;
    await equipment.update(
      { available_quantity: newAvailable },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Peminjaman berhasil dibuat',
      loan: {
        ...loan.toJSON(),
        borrower,
        equipment
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating loan:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// RETURN loan (pengembalian alat)
exports.returnLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { return_date, return_condition, damage_notes, damage_cost } = req.body;

    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (loan.status === 'Selesai') {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Peminjaman sudah selesai' });
    }

    // Calculate days borrowed
    const loanDateObj = new Date(loan.loan_date);
    const returnDateObj = new Date(return_date);
    const daysBorrowed = Math.ceil((returnDateObj - loanDateObj) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate rental cost
    const rentalCost = daysBorrowed * loan.daily_rate * loan.quantity;

    // Check if late
    const dueDateObj = new Date(loan.due_date);
    const isLate = returnDateObj > dueDateObj;
    const lateDays = isLate ? Math.ceil((returnDateObj - dueDateObj) / (1000 * 60 * 60 * 24)) : 0;
    const lateFee = isLate ? (lateDays * loan.daily_rate * loan.quantity * 0.5) : 0; // 50% penalty

    // Update loan
    await loan.update({
      return_date,
      return_condition: return_condition || 'Baik',
      damage_notes: damage_notes || null,
      damage_cost: parseInt(damage_cost) || 0,
      rental_cost: rentalCost,
      is_late: isLate,
      late_fee: Math.round(lateFee),
      status: 'Selesai'
    }, { transaction });

    // Update equipment condition dan availability
    const equipment = await Equipment.findByPk(loan.equipment_id, { transaction });
    const newAvailable = equipment.available_quantity + loan.quantity;

    await equipment.update({
      available_quantity: Math.min(newAvailable, equipment.total_quantity),
      condition: return_condition || equipment.condition
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Pengembalian alat berhasil diproses',
      loan: {
        ...loan.toJSON(),
        rental_summary: {
          daysBorrowed,
          dailyRate: loan.daily_rate,
          rentalCost,
          isLate,
          lateDays,
          lateFee: Math.round(lateFee),
          totalCost: rentalCost + parseInt(damage_cost || 0) + Math.round(lateFee)
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error returning loan:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPDATE loan (edit peminjaman yang belum selesai)
exports.updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { due_date, notes } = req.body;

    const loan = await Loan.findByPk(id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (loan.status !== 'Aktif') {
      return res.status(400).json({ success: false, error: 'Hanya peminjaman aktif yang bisa diubah' });
    }

    await loan.update({
      due_date: due_date || loan.due_date,
      notes: notes !== undefined ? notes : loan.notes
    });

    res.json({
      success: true,
      message: 'Peminjaman berhasil diperbarui',
      loan
    });
  } catch (error) {
    console.error('❌ Error updating loan:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// CANCEL loan
exports.cancelLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (loan.status !== 'Aktif') {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Hanya peminjaman aktif yang bisa dibatalkan' });
    }

    // Update loan status
    await loan.update({ status: 'Dibatalkan' }, { transaction });

    // Return equipment availability
    const equipment = await Equipment.findByPk(loan.equipment_id, { transaction });
    const newAvailable = equipment.available_quantity + loan.quantity;
    await equipment.update(
      { available_quantity: Math.min(newAvailable, equipment.total_quantity) },
      { transaction }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Peminjaman berhasil dibatalkan',
      loan
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error canceling loan:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET loans by borrower
exports.getLoansByBorrower = async (req, res) => {
  try {
    const { borrower_id } = req.params;
    const loans = await Loan.findAll({
      where: { borrower_id },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['loan_date', 'DESC']]
    });
    res.json({
      success: true,
      loans: loans,
      count: loans.length
    });
  } catch (error) {
    console.error('❌ Error getting loans by borrower:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET loans by equipment
exports.getLoansByEquipment = async (req, res) => {
  try {
    const { equipment_id } = req.params;
    const loans = await Loan.findAll({
      where: { equipment_id },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['loan_date', 'DESC']]
    });
    res.json({
      success: true,
      loans: loans,
      count: loans.length
    });
  } catch (error) {
    console.error('❌ Error getting loans by equipment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET late loans
exports.getLateLoans = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const loans = await Loan.findAll({
      where: {
        status: 'Aktif',
        is_late: true
      },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['due_date', 'ASC']]
    });
    res.json({
      success: true,
      loans: loans,
      count: loans.length
    });
  } catch (error) {
    console.error('❌ Error getting late loans:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET pending approvals (Petugas/Admin only)
exports.getPendingApprovals = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { approval_status: 'Pending' },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['createdAt', 'ASC']]
    });
    res.json({
      success: true,
      loans: loans,
      count: loans.length
    });
  } catch (error) {
    console.error('❌ Error getting pending approvals:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// APPROVE loan (Petugas/Admin only)
exports.approveLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { approved_by } = req.body; // User ID dari authenticated user

    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (loan.approval_status !== 'Pending') {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Peminjaman sudah diproses' });
    }

    // Update approval status
    await loan.update({
      approval_status: 'Approved',
      status: 'Aktif',
      approved_by,
      approved_at: new Date()
    }, { transaction });

    // Update equipment availability
    const equipment = await Equipment.findByPk(loan.equipment_id, { transaction });
    const newAvailable = equipment.available_quantity - loan.quantity;

    await Equipment.update(
      { available_quantity: newAvailable },
      { where: { id: loan.equipment_id }, transaction }
    );

    await transaction.commit();

    // Notify borrower
    const borrowerUserId = await getUserIdForBorrower(loan.borrower_id);
    if (borrowerUserId) {
      await notify({
        userId: borrowerUserId,
        type: 'loan_approved',
        title: '✅ Peminjaman Disetujui',
        message: `Permintaan peminjaman Anda (${loan.loan_number}) telah disetujui. Silakan ambil alat sesuai jadwal.`,
        entityType: 'Loan',
        entityId: loan.id,
        actionUrl: '/dashboard-borrower.html#myloans'
      });
    }

    // Audit log
    await audit({
      actor: req.user,
      action: 'LOAN_APPROVED',
      entityType: 'Loan',
      entityId: loan.id,
      oldValue: { approval_status: 'Pending' },
      newValue: { approval_status: 'Approved', status: 'Aktif' },
      description: `Loan ${loan.loan_number} approved by ${req.user?.name || req.user?.username}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Peminjaman berhasil disetujui',
      loan
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error approving loan:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// REJECT loan (Petugas/Admin only)
exports.rejectLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { rejection_reason, approved_by } = req.body;

    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (loan.approval_status !== 'Pending') {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Peminjaman sudah diproses' });
    }

    // Update approval status
    await loan.update({
      approval_status: 'Rejected',
      status: 'Dibatalkan',
      rejection_reason,
      approved_by,
      approved_at: new Date()
    }, { transaction });

    await transaction.commit();

    // Notify borrower
    const borrowerUserId = await getUserIdForBorrower(loan.borrower_id);
    if (borrowerUserId) {
      await notify({
        userId: borrowerUserId,
        type: 'loan_rejected',
        title: '❌ Peminjaman Ditolak',
        message: `Permintaan peminjaman Anda (${loan.loan_number}) ditolak. Alasan: ${rejection_reason || 'Tidak ada alasan yang diberikan'}.`,
        entityType: 'Loan',
        entityId: loan.id,
        actionUrl: '/dashboard-borrower.html#myloans'
      });
    }

    // Audit log
    await audit({
      actor: req.user,
      action: 'LOAN_REJECTED',
      entityType: 'Loan',
      entityId: loan.id,
      oldValue: { approval_status: 'Pending' },
      newValue: { approval_status: 'Rejected', rejection_reason },
      description: `Loan ${loan.loan_number} rejected. Reason: ${rejection_reason}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Peminjaman berhasil ditolak',
      loan
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error rejecting loan:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};
// SUBMIT RETURN - Customer/Peminjam mengembalikan barang (masuk grace period)
exports.submitReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { return_condition, damage_notes, damage_cost, grace_period_days = 1 } = req.body;

    console.log(`📝 Submit return for loan ${id}:`, { return_condition, damage_notes, damage_cost, grace_period_days });

    const loan = await Loan.findByPk(id, {
      include: [
        { model: Equipment, as: 'equipment' },
        { model: Borrower, as: 'borrower' }
      ],
      transaction
    });

    if (!loan) {
      await transaction.rollback();
      console.log(`❌ Loan ${id} not found`);
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    console.log(`📊 Loan ${id} status: ${loan.status}, return_status: ${loan.return_status}`);

    // Check if loan can be returned
    if (loan.status === 'Completed' || loan.status === 'Selesai' || loan.return_status === 'Verified') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Pinjaman sudah selesai dan tidak dapat dikembalikan lagi',
        current_status: loan.status
      });
    }

    if (loan.return_status === 'Returned') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Barang sudah dikembalikan dan sedang menunggu verifikasi'
      });
    }

    // Update loan dengan return status "Returned" (menunggu verifikasi)
    // New status: Returning
    await loan.update({
      return_status: 'Returned',
      returned_at: new Date(),
      return_condition: return_condition || 'Baik',
      damage_notes: damage_notes || null,
      damage_cost: parseInt(damage_cost) || 0,
      grace_period_days: parseInt(grace_period_days) || 1,
      status: 'Returning'
    }, { transaction });

    // Jika kondisi tidak baik, buat record DamageReview
    if (return_condition !== 'Baik') {
      await DamageReview.create({
        loan_id: id,
        status: 'Waiting for Review'
      }, { transaction });
    }

    await transaction.commit();

    // Notify Staff/Admin
    const staffAndAdmins = await User.findAll({ where: { role: ['staff', 'admin', 'petugas'] } });
    const staffIds = staffAndAdmins.map(u => u.id);
    for (const staffId of staffIds) {
      await notify({
        userId: staffId,
        type: 'return_submitted',
        title: '📦 Pengembalian Menunggu Verifikasi',
        message: `Peminjam ${loan.borrower?.name || 'Customer'} mengembalikan alat (${loan.loan_number}). Silakan periksa kondisinya.`,
        entityType: 'Loan',
        entityId: loan.id,
        actionUrl: `/dashboard-staff.html#returns`
      });
    }

    // Audit Log
    try {
      await audit({
        actor: req.user,
        action: 'RETURN_SUBMITTED',
        entityType: 'Loan',
        entityId: loan.id,
        description: `Loan ${loan.loan_number} returned by borrower. Condition: ${return_condition}`,
        ipAddress: req.ip
      });
    } catch (auditErr) { console.error('Audit Log Error:', auditErr); }

    res.json({
      success: true,
      message: 'Pengembalian barang diterima, menunggu verifikasi staff',
      loan
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error submitting return:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan: ' + error.message });
  }
};

// VERIFY RETURN - Staff memverifikasi pengembalian barang
exports.verifyReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { verified_condition, verified_notes, is_verified, return_date } = req.body;
    const verified_by = req.user?.id;

    if (!verified_by) {
      await transaction.rollback();
      return res.status(401).json({ success: false, error: 'User tidak dikenali' });
    }

    const loan = await Loan.findByPk(id, {
      include: [
        { model: Equipment, as: 'equipment' },
        { model: Borrower, as: 'borrower' }
      ],
      transaction
    });

    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (loan.return_status !== 'Returned' && loan.status !== 'Returning') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Barang belum dikembalikan atau sudah diverifikasi'
      });
    }

    if (!is_verified) {
      // Jika tidak disetujui (misal barang salah/tidak lengkap), kembalikan ke status Aktif atau biarkan di Returning dengan catatan
      await loan.update({
        damage_notes: `[Re-verification required] ${verified_notes || ''}`,
        verified_by
      }, { transaction });

      await transaction.commit();

      return res.json({
        success: true,
        message: 'Pengembalian barang ditolak untuk reverifikasi',
        loan
      });
    }

    // Determine final target status based on condition
    let finalStatus = 'Completed';
    let returnStatus = 'Verified';
    if (verified_condition !== 'Baik') {
      finalStatus = 'Penalty_Pending';
      returnStatus = 'Verified';

      // Update DamageReview status if it exists
      const dr = await DamageReview.findOne({ where: { loan_id: id }, transaction });
      if (dr) {
        await dr.update({
          status: 'Under Inspection',
          inspection_notes: verified_notes,
          staff_id: verified_by
        }, { transaction });
      } else {
        await DamageReview.create({
          loan_id: id,
          status: 'Under Inspection',
          inspection_notes: verified_notes,
          staff_id: verified_by,
          created_at: new Date()
        }, { transaction });
      }
    }

    // Calculate days borrowed and costs
    const loanDateObj = new Date(loan.loan_date);
    const returnDateObj = new Date(return_date || loan.returned_at || new Date());
    const daysBorrowed = Math.ceil((returnDateObj - loanDateObj) / (1000 * 60 * 60 * 24)) + 1;
    const rentalCost = daysBorrowed * loan.daily_rate * loan.quantity;

    const dueDateObj = new Date(loan.due_date);
    const isLate = returnDateObj > dueDateObj;
    const lateDays = isLate ? Math.ceil((returnDateObj - dueDateObj) / (1000 * 60 * 60 * 24)) : 0;
    const lateFee = isLate ? (lateDays * loan.daily_rate * loan.quantity * 0.5) : 0;

    // Update loan
    await loan.update({
      return_status: returnStatus,
      return_date: return_date || loan.returned_at || new Date(),
      return_condition: verified_condition || loan.return_condition,
      damage_notes: verified_notes || loan.damage_notes,
      rental_cost: rentalCost,
      is_late: isLate,
      late_fee: Math.round(lateFee),
      status: finalStatus,
      verified_at: new Date(),
      verified_by
    }, { transaction });

    // Update equipment availability
    const equipment = loan.equipment;
    if (equipment) {
      const newAvailable = equipment.available_quantity + loan.quantity;
      await equipment.update({
        available_quantity: Math.min(newAvailable, equipment.total_quantity),
        condition: verified_condition || equipment.condition
      }, { transaction });
    }

    await transaction.commit();

    // Notify borrower
    const borrowerUserId = await getUserIdForBorrower(loan.borrower_id);
    if (borrowerUserId) {
      await notify({
        userId: borrowerUserId,
        type: 'return_verified',
        title: finalStatus === 'Completed' ? '✅ Pengembalian Selesai' : '🔍 Hasil Verifikasi Pengembalian',
        message: finalStatus === 'Completed'
          ? `Alat (${loan.loan_number}) telah diperiksa dan dinyatakan baik. Terima kasih!`
          : `Alat (${loan.loan_number}) telah diperiksa. Ditemukan kondisi: ${verified_condition}. Silakan periksa detail denda.`,
        entityType: 'Loan',
        entityId: loan.id,
        actionUrl: '/dashboard-borrower.html#myloans'
      });
    }

    // Audit Log
    await audit({
      actor: req.user,
      action: 'RETURN_VERIFIED',
      entityType: 'Loan',
      entityId: loan.id,
      description: `Return verified for ${loan.loan_number}. Result: ${finalStatus}. Condition: ${verified_condition}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Pengembalian barang berhasil diverifikasi',
      loan
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error verifying return:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET returns awaiting verification - untuk dashboard staff
exports.getReturnsAwaitingVerification = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: {
        return_status: 'Returned',
        status: 'Aktif'
      },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['returned_at', 'ASC']],
      attributes: [
        'id', 'loan_number', 'borrower_id', 'equipment_id', 'quantity',
        'loan_date', 'due_date', 'returned_at', 'return_condition',
        'damage_notes', 'damage_cost', 'grace_period_days', 'return_status'
      ]
    });

    // Calculate grace period status untuk setiap return
    const loansWithGracePeriod = loans.map(loan => {
      const gracePeriodEnd = new Date(loan.returned_at.getTime() + (loan.grace_period_days * 24 * 60 * 60 * 1000));
      const now = new Date();
      const isGracePeriodExpired = now > gracePeriodEnd;
      const hoursRemainingInGracePeriod = Math.max(0, (gracePeriodEnd - now) / (1000 * 60 * 60));

      return {
        ...loan.toJSON(),
        grace_period_end: gracePeriodEnd,
        is_grace_period_expired: isGracePeriodExpired,
        hours_remaining: Math.round(hoursRemainingInGracePeriod)
      };
    });

    res.json({
      success: true,
      count: loansWithGracePeriod.length,
      loans: loansWithGracePeriod
    });
  } catch (error) {
    console.error('❌ Error getting returns awaiting verification:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET verified returns - list barang yang sudah diverifikasi
exports.getVerifiedReturns = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: {
        return_status: 'Verified'
      },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['verified_at', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      count: loans.length,
      loans
    });
  } catch (error) {
    console.error('❌ Error getting verified returns:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET loan details with cost breakdown for return process
exports.getLoanDetailsForReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id, {
      include: [
        { model: Equipment, as: 'equipment' },
        { model: Borrower, as: 'borrower' }
      ]
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    // Calculate current costs
    const today = new Date();
    const loanDate = new Date(loan.loan_date);
    const dueDate = new Date(loan.due_date);
    const daysBorrowed = Math.ceil((today - loanDate) / (1000 * 60 * 60 * 24));
    const daysLate = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));

    const dailyRate = loan.equipment?.daily_rental_rate || 0;
    const rentalCost = daysBorrowed * dailyRate * loan.quantity;
    const lateFeePerDay = Math.ceil(dailyRate * 0.1); // 10% of daily rate as late fee
    const totalLateFee = daysLate * lateFeePerDay;

    // Calculate damage cost estimates
    const damageCostEstimates = {
      'Baik': 0,
      'Rusak Ringan': 50000,
      'Rusak Sedang': 150000,
      'Rusak Berat': 500000,
      'Hilang': 1000000 // Full replacement cost
    };

    const currentDamageCost = loan.damage_cost || 0;
    const estimatedDamageCosts = Object.entries(damageCostEstimates).map(([condition, cost]) => ({
      condition,
      estimated_cost: cost,
      is_current: loan.return_condition === condition
    }));

    // Calculate total cost
    const subtotalCost = rentalCost + currentDamageCost + totalLateFee;
    const adminFee = Math.ceil(subtotalCost * 0.05); // 5% admin fee
    const totalCost = subtotalCost + adminFee;

    res.json({
      success: true,
      loan: {
        ...loan.toJSON(),
        cost_breakdown: {
          rental_cost: rentalCost,
          damage_cost: currentDamageCost,
          late_fee: totalLateFee,
          admin_fee: adminFee,
          subtotal: subtotalCost,
          total: totalCost
        },
        borrowing_details: {
          days_borrowed: daysBorrowed,
          days_late: daysLate,
          daily_rate: dailyRate,
          quantity: loan.quantity
        },
        damage_cost_estimates: estimatedDamageCosts,
        return_summary: {
          current_condition: loan.return_condition,
          current_damage_cost: currentDamageCost,
          estimated_damage_cost: damageCostEstimates[loan.return_condition] || 0
        },
        payment_summary: {
          rental_fee: `Rp ${rentalCost.toLocaleString('id-ID')}`,
          damage_fee: `Rp ${currentDamageCost.toLocaleString('id-ID')}`,
          late_fee: `Rp ${totalLateFee.toLocaleString('id-ID')}`,
          admin_fee: `Rp ${adminFee.toLocaleString('id-ID')}`,
          subtotal: `Rp ${subtotalCost.toLocaleString('id-ID')}`,
          total_payment: `Rp ${totalCost.toLocaleString('id-ID')}`,
          total_payment_class: 'p-6 overflow-y-auto max-h-[calc(90vh-200px)]',
          breakdown: [
            {
              item: 'Biaya Sewa',
              days: daysBorrowed,
              rate: `Rp ${dailyRate.toLocaleString('id-ID')}/hari`,
              amount: `Rp ${rentalCost.toLocaleString('id-ID')}`
            },
            {
              item: 'Biaya Kerusakan',
              condition: loan.return_condition || 'Baik',
              amount: `Rp ${currentDamageCost.toLocaleString('id-ID')}`
            },
            {
              item: 'Denda Keterlambatan',
              days_late: daysLate,
              rate: `Rp ${lateFeePerDay.toLocaleString('id-ID')}/hari`,
              amount: `Rp ${totalLateFee.toLocaleString('id-ID')}`
            },
            {
              item: 'Biaya Admin (5%)',
              amount: `Rp ${adminFee.toLocaleString('id-ID')}`
            },
            {
              item: 'TOTAL PEMBAYARAN',
              amount: `Rp ${totalCost.toLocaleString('id-ID')}`,
              is_total: true,
              css_class: 'p-6 overflow-y-auto max-h-[calc(90vh-200px)]'
            }
          ]
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting loan details:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};