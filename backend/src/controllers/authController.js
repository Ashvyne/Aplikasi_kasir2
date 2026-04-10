const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, email, password, role, name } = req.body;
  
  // Valid roles: admin, cashier, kitchen, customer
  const validRoles = ['admin', 'cashier', 'kitchen', 'customer'];
  
  // Restricted roles usually should be created by an Admin, but for this demo 
  // we allow public registration or default to customer
  const userRole = validRoles.includes(role) ? role : 'customer'; 

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username sudah terdaftar' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const newUser = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password, // Plain password, will be hashed by User model beforeCreate hook
      name: name || username,
      role: userRole
    });

    res.status(201).json({ 
      success: true,
      message: 'Registrasi berhasil! Silakan login.', 
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat pendaftaran' });
  }
};

// Login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Search by username or email
    const user = await User.findOne({ 
      where: { username: username.toLowerCase() } 
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    // Generate token
    const sessionId = uuidv4();
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        sessionId: sessionId
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({ 
      success: true,
      message: 'Login berhasil',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name,
        email: user.email 
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Logout 
exports.logout = async (req, res) => {
  // In JWT architecture, logout is usually handled by client clearing the token.
  // Optionally you can blacklist the token in Redis here.
  res.json({ success: true, message: 'Logout berhasil' });
};

// Change Password
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password saat ini tidak sesuai' });
    }

    user.password = newPassword; 
    await user.save();

    res.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui password' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
       return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'name', 'role']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
