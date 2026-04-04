/**
 * ============================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ============================================
 * 
 * Comprehensive role-based access control system
 * with clear role enforcement: Admin, Cashier, Kitchen, Customer
 */

const jwt = require('jsonwebtoken');

// ============ ROLE DEFINITIONS ============
const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  KITCHEN: 'kitchen',
  CUSTOMER: 'customer'
};

// ============ TOKEN VERIFICATION ============
/**
 * Verify JWT token and extract user information
 * Attaches user data to req.user
 */
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' 
      });
    }

    console.log('🔐 Verifying token...');
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('🔐 JWT verification error:', err.message);
        return res.status(401).json({ 
          success: false,
          message: 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.' 
        });
      }

      req.user = user;
      console.log(`✓ Token verified for user: ${user.username} (role: ${user.role})`);
      next();
    });
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

// ============ ADMIN AUTHORIZATION ============
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ 
      success: false,
      message: 'Akses ditolak. Membutuhkan hak akses Admin.'
    });
  }
  next();
};

// ============ CASHIER AUTHORIZATION ============
exports.requireCashier = (req, res, next) => {
  if (!req.user || ![ROLES.ADMIN, ROLES.CASHIER].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      message: 'Akses ditolak. Membutuhkan hak akses Kasir.'
    });
  }
  next();
};

// ============ KITCHEN AUTHORIZATION ============
exports.requireKitchen = (req, res, next) => {
  if (!req.user || ![ROLES.ADMIN, ROLES.KITCHEN].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      message: 'Akses ditolak. Membutuhkan hak akses Dapur.'
    });
  }
  next();
};

// ============ CUSTOMER AUTHORIZATION ============
exports.requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.CUSTOMER) {
    return res.status(403).json({ 
      success: false,
      message: 'Akses ditolak. Membutuhkan hak akses Pelanggan.'
    });
  }
  next();
};

// ============ FLEXIBLE ROLE CHECKING ============
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Silakan login terlebih dahulu' 
      });
    }
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Admin has access to everything by default except explicitly denied
    // If you want pure strict checking, remove the "roles.includes('admin')" assuming 'admin' wasn't passed.
    // In this app, Admin runs everything:
    if (!roles.includes(req.user.role) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ 
        success: false,
        message: 'Anda tidak memiliki akses ke fitur ini',
        requiredRoles: roles
      });
    }
    
    next();
  };
};

// Legacy exports for backwards compatibility during migration
exports.requireItemUser = exports.requireAdmin;
exports.requireAdminBarang = exports.requireAdmin;
exports.requireAdminKasir = exports.requireCashier;

exports.ROLES = ROLES;
