/**
 * AUTH MIDDLEWARE - RBAC SYSTEM
 * 
 * Provides JWT verification and role-based access control.
 * 
 * Role Hierarchy:
 *   admin > staff > borrower/customer
 * 
 * Legacy roles (petugas, peminjam) are mapped transparently.
 */
const jwt = require('jsonwebtoken');

// ─── Role Normalization ────────────────────────────────────────────────────
// Maps legacy/alias roles to canonical roles
const ROLE_MAP = {
  'peminjam': 'borrower',
  'customer': 'borrower',
  'petugas': 'staff',
};

const normalizeRole = (role) => ROLE_MAP[role] || role;

// ─── Role Sets ────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['admin'];
const STAFF_ROLES = ['admin', 'staff', 'petugas'];
const BORROWER_ROLES = ['borrower', 'customer', 'peminjam'];
const ALL_OPERATIONAL_ROLES = ['admin', 'staff', 'petugas'];

// ─── Core Token Verification ──────────────────────────────────────────────
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Token tidak valid: ' + err.message });
      }
      // Attach normalized role alongside original
      req.user = {
        ...user,
        normalizedRole: normalizeRole(user.role)
      };
      next();
    });
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(500).json({ success: false, message: 'Auth error' });
  }
};

// ─── Generic Role Checker Factory ─────────────────────────────────────────
/**
 * Creates a middleware that allows only the specified roles.
 * Checks both original and normalized roles for backward compatibility.
 */
const requireRoles = (allowedRoles, errorMessage) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const userRole = req.user.role;
  const normalizedUserRole = req.user.normalizedRole;
  if (!allowedRoles.includes(userRole) && !allowedRoles.includes(normalizedUserRole)) {
    return res.status(403).json({
      success: false,
      error: errorMessage || `Akses ditolak. Role yang diizinkan: ${allowedRoles.join(', ')}`
    });
  }
  next();
};

// ─── Named Middleware Exports ──────────────────────────────────────────────

/** Admin only */
exports.requireAdmin = requireRoles(ADMIN_ROLES, 'Hanya Admin yang dapat mengakses');

/** Staff or Admin (operational roles) */
exports.requireAdminOrStaff = requireRoles(STAFF_ROLES, 'Hanya Admin atau Staff yang dapat mengakses');

/** Borrower/Customer only */
exports.requireBorrower = requireRoles(BORROWER_ROLES, 'Hanya Peminjam yang dapat mengakses');

/** Any authenticated user who is a borrower or staff/admin */
exports.requireAnyRole = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
};

// ─── Legacy Aliases (backward compatibility) ──────────────────────────────
exports.requireStaff = requireRoles(STAFF_ROLES, 'Hanya Staff yang dapat mengakses');
exports.requirePetugas = requireRoles(STAFF_ROLES, 'Hanya Petugas/Staff yang dapat mengakses');
exports.requirePeminjam = requireRoles(BORROWER_ROLES, 'Hanya Peminjam yang dapat mengakses');
exports.requireAdminOrPetugas = requireRoles(STAFF_ROLES, 'Hanya Admin atau Petugas yang dapat mengakses');
exports.requireAdminOrPetugasOrStaff = requireRoles(ALL_OPERATIONAL_ROLES, 'Hanya Admin, Petugas, atau Staff yang dapat mengakses');

// Legacy kasir roles (kept for backward compatibility with old routes)
exports.requireAdminBarang = requireRoles(['admin', 'manager', 'admin_barang'], 'Hanya Admin Barang yang dapat mengakses');
exports.requireAdminKasir = requireRoles(['admin_kasir'], 'Hanya Admin Kasir yang dapat mengakses');

// ─── Ownership Guard ──────────────────────────────────────────────────────
/**
 * Middleware factory: ensures a customer can only access their own resource.
 * Staff and Admin bypass this check.
 * 
 * Usage: requireOwnerOrStaff((req) => req.params.borrower_id)
 * The getter function should return the owner's borrower_id from the request.
 */
exports.requireOwnerOrStaff = (getBorrowerId) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const role = req.user.normalizedRole;

  // Staff and Admin can access any resource
  if (STAFF_ROLES.includes(role) || STAFF_ROLES.includes(req.user.role)) {
    return next();
  }

  // For borrowers, verify ownership
  if (BORROWER_ROLES.includes(role) || BORROWER_ROLES.includes(req.user.role)) {
    try {
      const Borrower = require('../models/Borrower');
      const borrower = await Borrower.findOne({ where: { email: req.user.email } });
      if (!borrower) {
        return res.status(403).json({ success: false, error: 'Profil peminjam tidak ditemukan' });
      }
      req.borrower = borrower; // Attach for downstream use
      const resourceOwnerId = parseInt(getBorrowerId(req));
      if (borrower.id !== resourceOwnerId) {
        return res.status(403).json({ success: false, error: 'Akses ditolak: bukan milik Anda' });
      }
      return next();
    } catch (err) {
      console.error('Ownership check error:', err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  return res.status(403).json({ success: false, error: 'Akses ditolak' });
};

// ─── Role Utilities (exported for use in controllers) ─────────────────────
exports.isAdmin = (user) => user && (user.role === 'admin' || user.normalizedRole === 'admin');
exports.isStaff = (user) => user && (STAFF_ROLES.includes(user.role) || STAFF_ROLES.includes(user.normalizedRole));
exports.isBorrower = (user) => user && (BORROWER_ROLES.includes(user.role) || BORROWER_ROLES.includes(user.normalizedRole));
exports.normalizeRole = normalizeRole;
