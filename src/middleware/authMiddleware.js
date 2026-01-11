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

// Middleware untuk check role - admin_barang dapat akses
exports.requireAdminBarang = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin_barang') {
    return res.status(403).json({ error: 'Anda tidak memiliki akses ke fitur ini. Hanya Admin Barang yang dapat mengakses.' });
  }
  next();
};

// Middleware untuk check role - admin_kasir dapat akses
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
