const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const borrowerController = require('../controllers/borrowerController');
const router = express.Router();

// GET all borrowers
router.get('/', verifyToken, borrowerController.getAllBorrowers);

// GET verified borrowers only
router.get('/verified/list', verifyToken, borrowerController.getVerifiedBorrowers);

// GET borrower by ID
router.get('/:id', verifyToken, borrowerController.getBorrowerById);

// CREATE borrower (Admin only)
router.post('/', verifyToken, requireAdmin, borrowerController.createBorrower);

// UPDATE borrower (Admin only)
router.put('/:id', verifyToken, requireAdmin, borrowerController.updateBorrower);

// VERIFY borrower (Admin only)
router.patch('/:id/verify', verifyToken, requireAdmin, borrowerController.verifyBorrower);

// DELETE borrower (Admin only)
router.delete('/:id', verifyToken, requireAdmin, borrowerController.deleteBorrower);

module.exports = router;
