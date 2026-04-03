const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Register
exports.register = async (req, res) => {
  const { username, email, password, role, name } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Data tidak lengkap' });
  }
  
  // Valid roles: admin, cashier, kitchen, customer
  const validRoles = ['admin', 'cashier', 'kitchen', 'customer'];
  
  // If no role provided, default to 'customer' for public registration
  // For other roles, a token/admin auth might be checked in the route, but for now we accept what's passed or default
  const userRole = validRoles.includes(role) ? role : 'customer'; 

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username sudah terdaftar' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: 'Email sudah terdaftar' });
    }

    // Note: User model has beforeCreate hook that hashes the password automatically.
    const newUser = await User.create({
      username,
      email,
      password, // Plain password, will be hashed by beforeCreate
      name: name || username,
      role: userRole
    });

    res.status(201).json({ 
      success: true,
      message: 'User berhasil dibuat', 
      userId: newUser.id,
      role: newUser.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password diperlukan' });
  }

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'User tidak ditemukan' });
    }

    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Password salah' });
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
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true,
      message: 'Login berhasil',
      token,
      sessionId,
      user: { id: user.id, username: user.username, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Logout 
exports.logout = async (req, res) => {
  // Since we removed DB sessions table, logout is handled purely client-side by dropping the JWT
  res.json({ message: 'Logout berhasil' });
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
