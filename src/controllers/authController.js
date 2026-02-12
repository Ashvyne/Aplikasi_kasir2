const User = require('../models/User');
const Borrower = require('../models/Borrower');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  /**
   * Register new user
   * - If role='peminjam': public self-registration with phone and organization
   * - Otherwise: admin-only user creation
   */
  register: async (req, res) => {
    try {
      const { name, email, password, phone, organization, role = 'peminjam' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak lengkap (diperlukan: name, email, password)'
        });
      }

      // Check if email exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }

      // Validate role if specified - Map peminjam/customer to borrower for database compatibility
      const validRoles = ['admin', 'petugas', 'peminjam', 'staff', 'borrower', 'customer'];
      let userRole = role;
      if (!validRoles.includes(userRole)) {
        userRole = 'borrower'; // Default to borrower
      }
      
      // Map roles to database-compatible values
      const roleMapping = {
        'peminjam': 'borrower',
        'customer': 'borrower',
        'petugas': 'staff'
      };
      if (roleMapping[userRole]) {
        userRole = roleMapping[userRole];
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // For borrower role, user starts as active
      const isActive = userRole !== 'staff'; // Only staff needs approval, others active

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: userRole,
        is_active: isActive
      });

      // If registering as borrower, create borrower record
      if ((userRole === 'borrower' || role === 'peminjam') && phone) {
        await Borrower.create({
          name,
          email,
          phone,
          organization: organization || null,
          is_verified: false
        });
      }

      res.status(201).json({
        success: true,
        message: userRole === 'peminjam' 
          ? 'Registrasi berhasil! Tunggu persetujuan admin sebelum bisa login.'
          : 'User berhasil dibuat',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: isActive ? 'Active' : 'Pending approval'
        }
      });
    } catch (error) {
      console.error('❌ Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat registrasi'
      });
    }
  },

  /**
   * Login with email/username and password
   * Generates JWT token
   */
  login: async (req, res) => {
    try {
      const { email, username, password } = req.body;
      const loginInput = email || username;

      if (!loginInput || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username/Email dan password harus diisi'
        });
      }

      // Find user by email or username
      const user = await User.findOne({ 
        where: {
          [require('sequelize').Op.or]: [
            { email: loginInput },
            { username: loginInput }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username/Email atau password salah'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda belum diaktifkan. Hubungi admin.'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Username/Email atau password salah'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✓ Login success:', loginInput, 'role:', user.role);

      res.json({
        success: true,
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
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
   * Change password for authenticated user
   */
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password lama dan baru harus diisi'
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password lama tidak sesuai'
        });
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      console.log('✓ Password changed:', user.email);

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });
    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengubah password'
      });
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('❌ Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }
};

module.exports = authController;
