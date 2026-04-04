/**
 * CATEGORY CONTROLLER
 * Manages menu categories (Food, Drinks, Snacks, etc.)
 */

const { Category } = require('../models');

// ============ CREATE CATEGORY ============
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, color, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await Category.create({
      name,
      description: description || null,
      icon: icon || 'utensils',
      color: color || '#FFD700',
      displayOrder: displayOrder || 0
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// ============ GET ALL CATEGORIES ============
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// ============ GET CATEGORY BY ID ============
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// ============ UPDATE CATEGORY ============
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, displayOrder, isActive } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      icon: icon || category.icon,
      color: color || category.color,
      displayOrder: displayOrder !== undefined ? displayOrder : category.displayOrder,
      isActive: isActive !== undefined ? isActive : category.isActive
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// ============ DELETE CATEGORY ============
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.update({ isActive: false }); // Soft delete

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// ============ REORDER CATEGORIES ============
exports.reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of {id, displayOrder}

    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: 'Invalid format' });
    }

    for (const cat of categories) {
      await Category.update({ displayOrder: cat.displayOrder }, { where: { id: cat.id } });
    }

    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reordering categories',
      error: error.message
    });
  }
};
