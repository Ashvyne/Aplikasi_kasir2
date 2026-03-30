const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole, ROLES } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Simple in-memory session store untuk demo (akan diganti dengan database di production)
const demoSessions = new Map();

// Demo users untuk fallback ketika database tidak tersedia
const DEMO_USERS = {
  'admin': {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    email: 'admin@kasir.local',
    password: '123456',
    role: 'admin_kasir'
  },
  'barang': {
    id: 2,
    username: 'barang',
    name: 'Barang User',
    email: 'barang@kasir.local',
    password: '123456',
    role: 'admin_barang'
  },
  'cashier': {
    id: 3,
    username: 'cashier',
    name: 'Cashier User',
    email: 'cashier@kasir.local',
    password: '123456',
    role: 'admin_kasir'
  }
};

// ============ REGISTRATION ============
router.post('/register', authController.register);

// ============ LOGIN WITH ROLE-BASED ACCESS CONTROL ============
/**
 * Generic login endpoint dengan role validation
 * Validasi: username + password + requiredRole MUST match
 * Frontend WAJIB mengirim requiredRole dari tombol yang di-klik
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, requiredRole } = req.body;

    // ============ VALIDATION ============
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        code: 'INVALID_INPUT',
        message: 'Username dan password harus diisi' 
      });
    }

    // WAJIB: Require role selection
    if (!requiredRole) {
      return res.status(400).json({ 
        success: false,
        code: 'ROLE_REQUIRED',
        message: 'Role login harus dipilih. Gunakan tombol login yang sesuai.' 
      });
    }

    // Validasi role yang diizinkan
    const VALID_ROLES = {
      'item_user': 'item_user',
      'cashier': 'cashier',
      'admin_barang': 'admin_barang',  // Legacy role
      'admin_kasir': 'admin_kasir'     // Legacy role
    };

    if (!VALID_ROLES[requiredRole]) {
      return res.status(400).json({ 
        success: false,
        code: 'INVALID_ROLE',
        message: 'Role yang dipilih tidak valid' 
      });
    }

    // ============ FIND USER ============
    let user = null;
    let isUsingDemoData = false;
    
    // Try to find user in database first
    try {
      user = await User.findOne({ where: { username } });
    } catch (dbError) {
      console.warn('⚠️ Database query failed, falling back to demo data:', dbError.message);
      // Fallback to demo users if database is unavailable
      user = DEMO_USERS[username] ? { ...DEMO_USERS[username] } : null;
      isUsingDemoData = !!user;
      
      if (user) {
        console.log(`✓ Using DEMO user: ${username}`);
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Username atau password salah' 
      });
    }

    // ============ VALIDATE PASSWORD ============
    let isPasswordValid = false;
    
    if (isUsingDemoData) {
      // For demo users, do simple password comparison
      isPasswordValid = (password === user.password);
    } else {
      // For database users, use bcrypt comparison
      isPasswordValid = await user.validatePassword(password);
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'Username atau password salah' 
      });
    }

    // ============ CRITICAL: VALIDATE ROLE MATCH ============
    // User role MUST match the required role (dengan support legacy mapping)
    const userRole = user.role;
    const newRoleMap = {
      'admin_barang': 'item_user',    // Map legacy to new role
      'admin_kasir': 'cashier'         // Map legacy to new role
    };
    const normalizedUserRole = newRoleMap[userRole] || userRole;
    const normalizedRequiredRole = newRoleMap[requiredRole] || requiredRole;

    if (normalizedUserRole !== normalizedRequiredRole) {
      console.warn(`❌ ROLE MISMATCH: User ${username} role=${userRole} tried to login as ${requiredRole}`);
      return res.status(403).json({ 
        success: false,
        code: 'ROLE_MISMATCH',
        message: `Akun ${username} adalah ${userRole}. Gunakan login yang sesuai dengan role Anda.`,
        userRole: userRole,
        requiredRole: requiredRole
      });
    }

    // ============ CREATE SESSION & TOKEN ============
    const sessionId = uuidv4();
    const sessionRole = normalizedUserRole;  // Use normalized role

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: sessionRole,
        sessionId: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Save session
    demoSessions.set(sessionId, {
      userId: user.id,
      username: user.username,
      role: sessionRole,
      loginRole: requiredRole,
      createdAt: new Date(),
      isActive: true
    });

    console.log(`✓ LOGIN SUCCESS: User=${username}, LoginRole=${requiredRole}, UserRole=${userRole}`);
    
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      sessionId,
      user: { 
        id: user.id, 
        username: user.username, 
        role: sessionRole,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.message || error);
    console.error('Error stack:', error.stack);
    
    // Provide specific error messages based on error type
    let errorCode = 'SERVER_ERROR';
    let errorMessage = 'Terjadi kesalahan pada server';
    
    if (error.message && error.message.includes('ETIMEDOUT')) {
      errorCode = 'DATABASE_TIMEOUT';
      errorMessage = 'Koneksi database timeout. Silakan coba lagi.';
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      errorCode = 'DATABASE_CONNECTION_ERROR';
      errorMessage = 'Tidak bisa terhubung ke database.';
    } else if (error.message && error.message.includes('SequelizeConnectionError')) {
      errorCode = 'DATABASE_ERROR';
      errorMessage = 'Kesalahan koneksi database.';
    }
    
    res.status(500).json({ 
      success: false,
      code: errorCode,
      message: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST logout - Logout session tertentu
router.post('/logout', (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    const token = req.headers.authorization?.split(' ')[1];

    if (!sessionId && !token) {
      return res.status(400).json({ 
        success: false,
        message: 'Session ID atau token diperlukan' 
      });
    }

    // Untuk demo, cukup hapus dari memory
    if (sessionId && demoSessions.has(sessionId)) {
      demoSessions.delete(sessionId);
      console.log(`✓ Session logged out: ${sessionId}`);
    }

    res.json({ 
      success: true,
      message: 'Logout berhasil' 
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Logout gagal' 
    });
  }
});

// GET sessions - Get all active sessions untuk user tertentu
router.get('/sessions', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Untuk demo, return semua session user
    const userSessions = Array.from(demoSessions.entries())
      .filter(([_, session]) => session.userId === userId && session.isActive)
      .map(([sessionId, session]) => ({
        id: sessionId,
        deviceName: session.deviceName,
        role: session.role,
        createdAt: session.createdAt,
        isActive: session.isActive
      }));

    res.json({ 
      success: true,
      sessions: userSessions 
    });
  } catch (error) {
    console.error('❌ Get sessions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data session' 
    });
  }
});

// POST logout-device/:sessionId - Logout device tertentu
router.post('/logout-device/:sessionId', verifyToken, (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Validasi bahwa session milik user saat ini
    if (demoSessions.has(sessionId)) {
      const session = demoSessions.get(sessionId);
      if (session.userId === userId) {
        demoSessions.delete(sessionId);
        console.log(`✓ Device logged out: ${sessionId}`);
        return res.json({ 
          success: true,
          message: 'Device berhasil logout' 
        });
      }
    }

    res.status(403).json({ 
      success: false,
      message: 'Unauthorized' 
    });
  } catch (error) {
    console.error('❌ Logout device error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Gagal logout device' 
    });
  }
});

// GET me - Get current authenticated user info
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
