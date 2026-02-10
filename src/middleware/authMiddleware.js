/**
 * ============================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ============================================
 * 
 * Comprehensive role-based access control system
 * with clear role enforcement for Item User and Cashier
 */

const jwt = require('jsonwebtoken');

// ============ DEFAULT ROLE DEFINITIONS ============
const ROLES = {
  ITEM_USER: 'item_user',      // Can access inventory/product management
  CASHIER: 'cashier',          // Can access POS/transaction management
  ADMIN_BARANG: 'admin_barang', // Legacy: maps to item_user
  ADMIN_KASIR: 'admin_kasir'    // Legacy: maps to cashier
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
        return res.status(403).json({ 
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

// ============ ITEM USER AUTHORIZATION ============
/**
 * Restrict access to Item User (Inventory Management)
 * Can access: Products, Stock In, Product Dashboard
 * Cannot access: Cashier/POS, Transactions
 */
exports.requireItemUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - No user found',
      message: 'Silakan login terlebih dahulu' 
    });
  }
  
  const itemUserRoles = [ROLES.ITEM_USER, ROLES.ADMIN_BARANG];
  
  if (!itemUserRoles.includes(req.user.role)) {
    console.warn(`❌ Access Denied: User ${req.user.username} (${req.user.role}) attempted to access Item User area`);
    return res.status(403).json({ 
      success: false,
      error: 'Access Denied',
      message: 'Anda tidak memiliki akses ke fitur ini. Hanya Staff Barang/Inventory yang dapat mengakses.',
      requiredRole: 'Item User',
      userRole: req.user.role
    });
  }
  
  console.log(`✓ Item User access granted to ${req.user.username}`);
  next();
};

exports.requireAdminBarang = exports.requireItemUser; // Legacy alias

// ============ CASHIER AUTHORIZATION ============
/**
 * Restrict access to Cashier (POS Management)
 * Can access: Transactions, POS Dashboard
 * Cannot access: Product Management, Inventory, Stock In
 */
exports.requireCashier = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - No user found',
      message: 'Silakan login terlebih dahulu' 
    });
  }
  
  const cashierRoles = [ROLES.CASHIER, ROLES.ADMIN_KASIR];
  
  if (!cashierRoles.includes(req.user.role)) {
    console.warn(`❌ Access Denied: User ${req.user.username} (${req.user.role}) attempted to access Cashier area`);
    return res.status(403).json({ 
      success: false,
      error: 'Access Denied',
      message: 'Anda tidak memiliki akses ke fitur ini. Hanya Cashier/POS yang dapat mengakses.',
      requiredRole: 'Cashier',
      userRole: req.user.role
    });
  }
  
  console.log(`✓ Cashier access granted to ${req.user.username}`);
  next();
};

exports.requireAdminKasir = exports.requireCashier; // Legacy alias

// ============ FLEXIBLE ROLE CHECKING ============
/**
 * Check if user has one of the allowed roles
 * Dynamic: Can be used for any role combination
 */
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Silakan login terlebih dahulu' 
      });
    }
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      console.warn(`❌ Access Denied: User ${req.user.username} (${req.user.role}) required: ${roles.join(', ')}`);
      return res.status(403).json({ 
        success: false,
        error: 'Access Denied',
        message: 'Anda tidak memiliki akses ke fitur ini',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    
    console.log(`✓ Role check passed for ${req.user.username}`);
    next();
  };
};

// ============ UTILITY FUNCTIONS ============
/**
 * Check if user is Item User
 */
exports.isItemUser = (user) => {
  return user && [ROLES.ITEM_USER, ROLES.ADMIN_BARANG].includes(user.role);
};

/**
 * Check if user is Cashier
 */
exports.isCashier = (user) => {
  return user && [ROLES.CASHIER, ROLES.ADMIN_KASIR].includes(user.role);
};

/**
 * Map legacy roles to new role names
 */
exports.normalizeRole = (role) => {
  const roleMap = {
    'admin_barang': ROLES.ITEM_USER,
    'item_user': ROLES.ITEM_USER,
    'admin_kasir': ROLES.CASHIER,
    'cashier': ROLES.CASHIER
  };
  return roleMap[role] || role;
};

// Export role definitions for use in other files
exports.ROLES = ROLES;
