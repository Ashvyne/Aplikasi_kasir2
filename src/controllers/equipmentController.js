/**
 * EQUIPMENT CONTROLLER
 * Mengelola operasi CRUD untuk alat/equipment
 */

const Equipment = require('../models/Equipment');

// GET all equipment
exports.getAllEquipment = async (req, res) => {
  try {
    console.log('✓ GET /api/equipment');
    const equipment = await Equipment.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    res.json({ 
      success: true,
      equipment: equipment,
      count: equipment.length 
    });
  } catch (error) {
    console.error('❌ Error getting equipment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET single equipment by ID
exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    }
    res.json({ success: true, equipment });
  } catch (error) {
    console.error('❌ Error getting equipment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// CREATE new equipment
exports.createEquipment = async (req, res) => {
  try {
    const { name, code, category, description, acquisition_cost, daily_rental_rate, total_quantity, location } = req.body;
    
    // Validasi input
    if (!name || !code || !daily_rental_rate) {
      return res.status(400).json({ 
        success: false,
        error: 'Data tidak lengkap. Diperlukan: name, code, daily_rental_rate' 
      });
    }

    // Cek kode unik
    const existingEquipment = await Equipment.findOne({ where: { code } });
    if (existingEquipment) {
      return res.status(400).json({ 
        success: false,
        error: 'Kode alat sudah digunakan' 
      });
    }

    const equipment = await Equipment.create({
      name,
      code,
      category,
      description,
      acquisition_cost: parseInt(acquisition_cost) || 0,
      daily_rental_rate: parseInt(daily_rental_rate),
      total_quantity: parseInt(total_quantity) || 1,
      available_quantity: parseInt(total_quantity) || 1,
      location
    });

    res.status(201).json({
      success: true,
      message: 'Alat berhasil ditambahkan',
      equipment
    });
  } catch (error) {
    console.error('❌ Error creating equipment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPDATE equipment
exports.updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, description, acquisition_cost, daily_rental_rate, condition, total_quantity, location, notes } = req.body;
    
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    }

    // Cek kode unik jika berubah
    if (code && code !== equipment.code) {
      const existingCode = await Equipment.findOne({ where: { code } });
      if (existingCode) {
        return res.status(400).json({ 
          success: false,
          error: 'Kode alat sudah digunakan' 
        });
      }
    }

    await equipment.update({
      name: name || equipment.name,
      code: code || equipment.code,
      category: category || equipment.category,
      description: description || equipment.description,
      acquisition_cost: acquisition_cost !== undefined ? parseInt(acquisition_cost) : equipment.acquisition_cost,
      daily_rental_rate: daily_rental_rate !== undefined ? parseInt(daily_rental_rate) : equipment.daily_rental_rate,
      condition: condition || equipment.condition,
      total_quantity: total_quantity !== undefined ? parseInt(total_quantity) : equipment.total_quantity,
      location: location || equipment.location,
      notes: notes || equipment.notes
    });

    res.json({ 
      success: true,
      message: 'Alat berhasil diperbarui',
      equipment 
    });
  } catch (error) {
    console.error('❌ Error updating equipment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// DELETE equipment
exports.deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    }

    // Soft delete - mark as inactive
    await equipment.update({ is_active: false });

    res.json({ 
      success: true,
      message: 'Alat berhasil dihapus' 
    });
  } catch (error) {
    console.error('❌ Error deleting equipment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPDATE equipment quantity
exports.updateEquipmentQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_quantity, available_quantity } = req.body;
    
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    }

    if (total_quantity !== undefined) {
      await equipment.update({ 
        total_quantity: parseInt(total_quantity),
        available_quantity: Math.min(parseInt(total_quantity), equipment.available_quantity)
      });
    }

    if (available_quantity !== undefined) {
      if (available_quantity > equipment.total_quantity) {
        return res.status(400).json({ 
          success: false,
          error: 'Jumlah tersedia tidak bisa melebihi total' 
        });
      }
      await equipment.update({ available_quantity: parseInt(available_quantity) });
    }

    res.json({ 
      success: true,
      message: 'Jumlah alat berhasil diperbarui',
      equipment 
    });
  } catch (error) {
    console.error('❌ Error updating equipment quantity:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET equipment availability
exports.getEquipmentAvailability = async (req, res) => {
  try {
    const equipment = await Equipment.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'code', 'total_quantity', 'available_quantity'],
      order: [['name', 'ASC']]
    });

    res.json({ 
      success: true,
      equipment: equipment.map(e => ({
        ...e.toJSON(),
        borrowed_quantity: e.total_quantity - e.available_quantity,
        availability_status: e.available_quantity > 0 ? 'Tersedia' : 'Tidak Tersedia'
      }))
    });
  } catch (error) {
    console.error('❌ Error getting equipment availability:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPDATE equipment condition (Staff use case: mencatat kondisi saat pengembalian)
exports.updateEquipmentCondition = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, notes } = req.body;
    
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    }
    
    // Validasi kondisi
    const validConditions = ['Baik', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat', 'Tidak Layak'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({ 
        success: false,
        error: `Kondisi tidak valid. Pilihan: ${validConditions.join(', ')}` 
      });
    }
    
    await equipment.update({
      condition: condition || equipment.condition,
      notes: notes || equipment.notes
    });
    
    res.json({ 
      success: true,
      message: 'Kondisi alat berhasil diperbarui',
      equipment 
    });
  } catch (error) {
    console.error('❌ Error updating equipment condition:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPLOAD image untuk equipment
exports.uploadEquipmentImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
    }

    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan' });
    }

    // Generate path untuk image
    const imagePath = `/uploads/equipment/${id}/${req.file.filename}`;

    await equipment.update({ image_url: imagePath });

    res.json({ 
      success: true,
      message: 'Gambar berhasil diupload',
    });
  } catch (error) {
    console.error('❌ Error uploading equipment image:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat upload' });
  }
};