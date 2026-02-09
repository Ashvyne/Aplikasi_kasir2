/**
 * LOAN CONTROLLER
 * Mengelola operasi peminjaman dan pengembalian alat
 */

const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');
const { sequelize } = require('../config/database');

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
    
    // Validasi input
    if (!borrower_id || !equipment_id || !loan_date || !due_date) {
      return res.status(400).json({ 
        success: false,
        error: 'Data tidak lengkap. Diperlukan: borrower_id, equipment_id, loan_date, due_date' 
      });
    }

    // Cek peminjam exists
    const borrower = await Borrower.findByPk(borrower_id, { transaction });
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
      borrower_id,
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

    console.log(`📊 Loan ${id} return_status: ${loan.return_status}`);

    if (loan.return_status !== 'Active') {
      await transaction.rollback();
      console.log(`❌ Loan ${id} is not Active (current: ${loan.return_status})`);
      return res.status(400).json({ 
        success: false, 
        error: 'Barang sudah dikembalikan atau sedang dalam proses verifikasi',
        current_status: loan.return_status
      });
    }

    // Update loan dengan return status "Returned" (menunggu verifikasi)
    await loan.update({
      return_status: 'Returned',
      returned_at: new Date(),
      return_condition: return_condition || 'Baik',
      damage_notes: damage_notes || null,
      damage_cost: parseInt(damage_cost) || 0,
      grace_period_days: parseInt(grace_period_days) || 1,
      status: 'Aktif' // Masih aktif hingga diverifikasi
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Pengembalian barang diterima, menunggu verifikasi staff',
      loan: {
        ...loan.toJSON(),
        grace_period_end: new Date(loan.returned_at.getTime() + (grace_period_days * 24 * 60 * 60 * 1000))
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error submitting return:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// VERIFY RETURN - Staff memverifikasi pengembalian barang
exports.verifyReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { verified_condition, verified_notes, is_verified, return_date } = req.body;
    const verified_by = req.user?.id; // Dari JWT token
    
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

    if (loan.return_status !== 'Returned') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Barang belum dikembalikan atau sudah diverifikasi' 
      });
    }

    if (!is_verified) {
      // Jika tidak disetujui, update status kembali ke "Returned" untuk re-check
      await loan.update({
        return_status: 'Returned',
        verified_at: new Date(),
        verified_by,
        damage_notes: verified_notes || loan.damage_notes
      }, { transaction });

      await transaction.commit();

      return res.json({
        success: true,
        message: 'Pengembalian barang ditolak untuk reverifikasi',
        loan
      });
    }

    // Calculate days borrowed
    const loanDateObj = new Date(loan.loan_date);
    const returnDateObj = new Date(return_date || loan.returned_at);
    const daysBorrowed = Math.ceil((returnDateObj - loanDateObj) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate rental cost
    const rentalCost = daysBorrowed * loan.daily_rate * loan.quantity;

    // Check if late
    const dueDateObj = new Date(loan.due_date);
    const isLate = returnDateObj > dueDateObj;
    const lateDays = isLate ? Math.ceil((returnDateObj - dueDateObj) / (1000 * 60 * 60 * 24)) : 0;
    const lateFee = isLate ? (lateDays * loan.daily_rate * loan.quantity * 0.5) : 0; // 50% penalty

    // Update loan dengan status "Verified"
    await loan.update({
      return_status: 'Verified',
      return_date: return_date || loan.returned_at,
      return_condition: verified_condition || loan.return_condition,
      damage_notes: verified_notes || loan.damage_notes,
      rental_cost: rentalCost,
      is_late: isLate,
      late_fee: Math.round(lateFee),
      status: 'Selesai',
      verified_at: new Date(),
      verified_by
    }, { transaction });

    // Update equipment condition dan availability
    const equipment = loan.equipment;
    const newAvailable = equipment.available_quantity + loan.quantity;
    
    await equipment.update({
      available_quantity: Math.min(newAvailable, equipment.total_quantity),
      condition: verified_condition || equipment.condition
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Pengembalian barang berhasil diverifikasi dan selesai',
      loan: {
        ...loan.toJSON(),
        rental_summary: {
          daysBorrowed,
          dailyRate: loan.daily_rate,
          rentalCost,
          isLate,
          lateDays,
          lateFee: Math.round(lateFee),
          damageCost: loan.damage_cost,
          totalCost: rentalCost + loan.damage_cost + Math.round(lateFee)
        }
      }
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