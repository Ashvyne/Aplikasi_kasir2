const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    console.log('🔐 Verifying token...');
    console.log('🔑 JWT_SECRET available:', !!process.env.JWT_SECRET);
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('🔐 JWT verification error:', err.message);
        console.error('🔐 Error type:', err.name);
        return res.status(403).json({ message: 'Token tidak valid: ' + err.message });
      }

      req.user = user;
      console.log('✓ Token verified for user:', user.username);
      next();
    });
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(500).json({ message: 'Auth error' });
  }
};

// Middleware untuk check role - Admin only
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya Admin yang dapat mengakses' });
  }
  next();
};

// Middleware untuk check role - Petugas only
exports.requirePetugas = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'petugas') {
    return res.status(403).json({ error: 'Hanya Petugas yang dapat mengakses' });
  }
  next();
};

// Middleware untuk check role - Peminjam only
exports.requirePeminjam = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'peminjam') {
    return res.status(403).json({ error: 'Hanya Peminjam yang dapat mengakses' });
  }
  next();
};

// Middleware untuk check role - Admin atau Petugas
exports.requireAdminOrPetugas = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'petugas') {
    return res.status(403).json({ error: 'Hanya Admin atau Petugas yang dapat mengakses' });
  }
  next();
};

// Middleware untuk check role - Staff only
exports.requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Hanya Staff yang dapat mengakses' });
  }
  next();
};

// Middleware untuk check role - Admin, Petugas, atau Staff
exports.requireAdminOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Hanya Admin atau Staff yang dapat mengakses' });
  }
  next();
};

// Middleware untuk check role - Admin, Petugas, Staff
exports.requireAdminOrPetugasOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'petugas' && req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Hanya Admin, Petugas, atau Staff yang dapat mengakses' });
  }
  next();
};

// Legacy middleware untuk backward compatibility
exports.requireAdminBarang = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'admin_barang') {
    return res.status(403).json({ error: 'Anda tidak memiliki akses ke fitur ini. Hanya Admin Barang yang dapat mengakses.' });
  }
  next();
};

exports.requireAdminKasir = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin_kasir') {
    return res.status(403).json({ error: 'Anda tidak memiliki akses ke fitur ini. Hanya Admin Kasir yang dapat mengakses.' });
  }
  next();
};

// Legacy middleware untuk backward compatibility
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses' });
    }
    next();
  };
};
