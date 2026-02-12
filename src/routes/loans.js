const express = require('express');
const { verifyToken, requireAdmin, requireAdminOrStaff, requireAdminOrPetugasOrStaff } = require('../middleware/authMiddleware');
const loanController = require('../controllers/loanController');
const router = express.Router();

// GET all loans (Admin, Staff, Petugas, Peminjam - filtered)
router.get('/', verifyToken, loanController.getAllLoans);

// ===== SPECIFIC ROUTES MUST COME BEFORE /:id =====

// GET active loans (Admin, Staff, Petugas)
router.get('/active/list', verifyToken, requireAdminOrPetugasOrStaff, loanController.getActiveLoans);

// GET returns awaiting verification (Admin, Staff only)
router.get('/returns/awaiting-verification', verifyToken, requireAdminOrStaff, loanController.getReturnsAwaitingVerification);

// GET verified returns (Admin, Staff, Petugas)
router.get('/returns/verified-list', verifyToken, requireAdminOrPetugasOrStaff, loanController.getVerifiedReturns);

// GET pending approvals (Admin, Staff, Petugas only)
router.get('/pending/approvals', verifyToken, requireAdminOrPetugasOrStaff, loanController.getPendingApprovals);

// GET late loans (Admin, Staff, Petugas only)
router.get('/late/list', verifyToken, requireAdminOrPetugasOrStaff, loanController.getLateLoans);

// GET loans by borrower (more specific than /:id)
router.get('/borrower/:borrower_id', verifyToken, loanController.getLoansByBorrower);

// GET loans by equipment (more specific than /:id)
router.get('/equipment/:equipment_id', verifyToken, loanController.getLoansByEquipment);

// ===== GENERIC ROUTES AFTER SPECIFIC ONES =====

// GET loan by ID
router.get('/:id', verifyToken, loanController.getLoanById);

// GET loan details for return process
router.get('/:id/return-details', verifyToken, loanController.getLoanDetailsForReturn);

// CREATE loan (Admin, Petugas only - creates Pending)
// Only import once at the top
// Allow Admin, Petugas, Staff, and Borrower
router.post('/', verifyToken, (req, res, next) => {
	// Allow if role is admin, petugas/staff, staff, or borrower
	const allowedRoles = ['admin', 'petugas', 'staff', 'borrower', 'customer', 'peminjam'];
	if (!req.user || !allowedRoles.includes(req.user.role)) {
		return res.status(403).json({ error: 'Hanya Admin, Petugas, Staff, atau Borrower yang dapat mengakses' });
	}
	next();
}, loanController.createLoan);

// SUBMIT RETURN - Customer/Peminjam mengembalikan barang (masuk grace period)
router.post('/:id/submit-return', verifyToken, loanController.submitReturn);

// VERIFY RETURN - Staff memverifikasi pengembalian barang
router.post('/:id/verify-return', verifyToken, requireAdminOrStaff, loanController.verifyReturn);

// APPROVE loan (Admin, Staff, Petugas only)
router.post('/:id/approve', verifyToken, requireAdminOrPetugasOrStaff, loanController.approveLoan);

// REJECT loan (Admin, Staff, Petugas only)
router.post('/:id/reject', verifyToken, requireAdminOrPetugasOrStaff, loanController.rejectLoan);

// UPDATE loan (Admin, Petugas only)
router.put('/:id', verifyToken, requireAdminOrPetugasOrStaff, loanController.updateLoan);

// RETURN loan / pengembalian (Admin, Staff, Petugas only) - Legacy endpoint
router.post('/:id/return', verifyToken, requireAdminOrStaff, loanController.returnLoan);

// CANCEL loan (Admin only)
router.post('/:id/cancel', verifyToken, requireAdmin, loanController.cancelLoan);

module.exports = router;
