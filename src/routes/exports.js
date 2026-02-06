const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');

// GET loans data as JSON (dapat di-export dari frontend)
router.get('/loans-json', verifyToken, requireAdmin, async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [
        { model: Borrower, attributes: ['name', 'phone'] },
        { model: Equipment, attributes: ['name', 'code', 'daily_rental_rate'] }
      ]
    });
    
    res.json({ success: true, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET equipment data as JSON
router.get('/equipment-json', verifyToken, requireAdmin, async (req, res) => {
  try {
    const equipment = await Equipment.findAll();
    res.json({ success: true, equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
