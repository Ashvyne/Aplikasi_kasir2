/**
 * CATEGORY CONTROLLER
 * Mengelola operasi CRUD untuk kategori alat
 */

const Category = require('../models/Category');

// GET all categories
exports.getAllCategories = async (req, res) => {
  try {
    console.log('✓ GET /api/categories');
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    res.json({ 
      success: true,
      categories: categories,
      count: categories.length 
    });
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    res.json({ success: true, category });
  } catch (error) {
    console.error('❌ Error getting category:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// CREATE new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    // Validasi input
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Nama kategori harus diisi' 
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        error: 'Kategori dengan nama ini sudah ada' 
      });
    }

    const category = await Category.create({
      name,
      description,
      icon,
      is_active: true
    });

    res.json({
      success: true,
      message: 'Kategori berhasil ditambahkan',
      category
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPDATE category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    // Check if new name already exists (excluding current)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        return res.status(400).json({ 
          success: false,
          error: 'Kategori dengan nama ini sudah ada' 
        });
      }
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      icon: icon || category.icon
    });

    res.json({
      success: true,
      message: 'Kategori berhasil diperbarui',
      category
    });
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// DELETE category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    await category.update({ is_active: false });

    res.json({
      success: true,
      message: 'Kategori berhasil dihapus'
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};
