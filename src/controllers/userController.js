/**
 * USER CONTROLLER
 * Mengelola operasi CRUD untuk user/pengguna sistem
 */

const User = require('../models/User');
const bcrypt = require('bcrypt');

// GET all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    console.log('✓ GET /api/users');
    const { role, is_active } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });

    res.json({ 
      success: true,
      users: users,
      count: users.length 
    });
  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET user by ID (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error getting user:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// CREATE new user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validasi input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false,
        error: 'Data tidak lengkap. Diperlukan: name, email, password, role' 
      });
    }

    // Validasi role
    const validRoles = ['admin', 'petugas', 'peminjam'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: `Role harus salah satu dari: ${validRoles.join(', ')}` 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email sudah digunakan' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// UPDATE user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, is_active } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Check if new email already exists (excluding current user)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'Email sudah digunakan' 
        });
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'petugas', 'peminjam'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          success: false,
          error: `Role harus salah satu dari: ${validRoles.join(', ')}` 
        });
      }
    }

    const updateData = {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      is_active: is_active !== undefined ? is_active : user.is_active
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'User berhasil diperbarui',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// DELETE user (soft delete - Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Prevent deleting admin if it's the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin', is_active: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false,
          error: 'Tidak bisa menghapus admin terakhir. Minimal 1 admin harus ada.' 
        });
      }
    }

    // Soft delete - set is_active to false
    await user.update({ is_active: false });

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Restore deleted user (Admin only)
exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    await user.update({ is_active: true });

    res.json({
      success: true,
      message: 'User berhasil direstore',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('❌ Error restoring user:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Get users by role (Admin only)
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const validRoles = ['admin', 'petugas', 'peminjam'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: `Role harus salah satu dari: ${validRoles.join(', ')}` 
      });
    }

    const users = await User.findAll({
      where: { role, is_active: true },
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      role,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Error getting users by role:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Update own profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Check if new email already exists (excluding current user)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'Email sudah digunakan' 
        });
      }
    }

    const updateData = {
      name: name || user.name,
      email: email || user.email
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Profile berhasil diperbarui',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};
