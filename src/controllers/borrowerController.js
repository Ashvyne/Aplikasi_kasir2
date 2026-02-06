/**
 * BORROWER CONTROLLER
 * Mengelola operasi CRUD untuk peminjam/borrower
 */

const Borrower = require('../models/Borrower');

// GET all borrowers
exports.getAllBorrowers = async (req, res) => {
  try {
    console.log('✓ GET /api/borrowers');
    const borrowers = await Borrower.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    res.json({ 
      success: true,
      borrowers: borrowers,
      count: borrowers.length 
    });
  } catch (error) {
    console.error('❌ Error getting borrowers:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET single borrower by ID
exports.getBorrowerById = async (req, res) => {
  try {
    const borrower = await Borrower.findByPk(req.params.id);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Peminjam tidak ditemukan' });
    }
    res.json({ success: true, borrower });
  } catch (error) {
    console.error('❌ Error getting borrower:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// CREATE new borrower
exports.createBorrower = async (req, res) => {
  try {
    const { 
      name, email, phone, identity_type, identity_number, address, 
      organization, contact_person, contact_person_phone 
    } = req.body;
    
    // Validasi input wajib
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false,
        error: 'Data tidak lengkap. Diperlukan: name, phone' 
      });
    }

    // Cek email unik jika ada
    if (email) {
      const existingEmail = await Borrower.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'Email sudah terdaftar' 
        });
      }
    }

    const borrower = await Borrower.create({
      name,
      email: email || null,
      phone,
      identity_type: identity_type || 'KTP',
      identity_number: identity_number || null,
      address: address || null,
      organization: organization || null,
      contact_person: contact_person || null,
      contact_person_phone: contact_person_phone || null
    });

    res.status(201).json({
      success: true,
      message: 'Peminjam berhasil ditambahkan',
      borrower
    });
  } catch (error) {
    console.error('❌ Error creating borrower:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPDATE borrower
exports.updateBorrower = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, email, phone, identity_type, identity_number, address,
      organization, contact_person, contact_person_phone 
    } = req.body;
    
    const borrower = await Borrower.findByPk(id);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Peminjam tidak ditemukan' });
    }

    // Cek email unik jika berubah
    if (email && email !== borrower.email) {
      const existingEmail = await Borrower.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'Email sudah terdaftar' 
        });
      }
    }

    await borrower.update({
      name: name || borrower.name,
      email: email !== undefined ? email : borrower.email,
      phone: phone || borrower.phone,
      identity_type: identity_type || borrower.identity_type,
      identity_number: identity_number !== undefined ? identity_number : borrower.identity_number,
      address: address !== undefined ? address : borrower.address,
      organization: organization !== undefined ? organization : borrower.organization,
      contact_person: contact_person !== undefined ? contact_person : borrower.contact_person,
      contact_person_phone: contact_person_phone !== undefined ? contact_person_phone : borrower.contact_person_phone
    });

    res.json({ 
      success: true,
      message: 'Peminjam berhasil diperbarui',
      borrower 
    });
  } catch (error) {
    console.error('❌ Error updating borrower:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// DELETE borrower (soft delete)
exports.deleteBorrower = async (req, res) => {
  try {
    const { id } = req.params;
    
    const borrower = await Borrower.findByPk(id);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Peminjam tidak ditemukan' });
    }

    // Soft delete - mark as inactive
    await borrower.update({ is_active: false });

    res.json({ 
      success: true,
      message: 'Peminjam berhasil dihapus' 
    });
  } catch (error) {
    console.error('❌ Error deleting borrower:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// VERIFY borrower
exports.verifyBorrower = async (req, res) => {
  try {
    const { id } = req.params;
    
    const borrower = await Borrower.findByPk(id);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Peminjam tidak ditemukan' });
    }

    await borrower.update({ is_verified: true });

    res.json({ 
      success: true,
      message: 'Peminjam berhasil diverifikasi',
      borrower 
    });
  } catch (error) {
    console.error('❌ Error verifying borrower:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET verified borrowers only
exports.getVerifiedBorrowers = async (req, res) => {
  try {
    const borrowers = await Borrower.findAll({
      where: { is_active: true, is_verified: true },
      order: [['name', 'ASC']]
    });
    res.json({ 
      success: true,
      borrowers: borrowers,
      count: borrowers.length 
    });
  } catch (error) {
    console.error('❌ Error getting verified borrowers:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};
