const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authController = {
  /**
   * Login user
   * Supports login dengan username atau email
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password harus diisi'
        });
      }

      // Find user by username or email
      const user = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { email: username },
            { username: username }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau email tidak ditemukan'
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Akun Anda belum diaktifkan. Hubungi administrator.'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password salah'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update last login
      await user.update({ last_login: new Date() });

      res.json({
        success: true,
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.name
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login'
      });
    }
  },

  /**
   * Register new user (admin only)
   */
  register: async (req, res) => {
    try {
      const { name, username, email, password, role = 'cashier' } = req.body;

      // Validate input
      if (!name || !username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak lengkap'
        });
      }

      // Check if username exists
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah terdaftar'
        });
      }

      // Check if email exists
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        name,
        username,
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
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('❌ Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat membuat user'
      });
    }
  },

  /**
   * Logout user
   */
  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logout berhasil'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat logout'
      });
    }
  },

  /**
   * Get current user info
   */
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  },

  /**
   * Change password
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password lama dan baru harus diisi'
        });
      }

      const user = await User.findByPk(req.user.id);

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password lama tidak sesuai'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }
};

module.exports = authController;
