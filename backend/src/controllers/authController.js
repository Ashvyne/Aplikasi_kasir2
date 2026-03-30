const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Register
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  
  // Validasi role - hanya admin_kasir atau admin_barang
  const validRoles = ['admin_kasir', 'admin_barang'];
  const userRole = validRoles.includes(role) ? role : 'admin_barang'; // Default ke admin_barang

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, userRole],
      function(err) {
        if (err) return res.status(400).json({ error: 'Username atau email sudah terdaftar' });
        res.status(201).json({ 
          message: 'User berhasil dibuat', 
          userId: this.lastID,
          role: userRole
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login - dengan multi-device session support
exports.login = async (req, res) => {
  const { username, password, deviceRole } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password diperlukan' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'User tidak ditemukan' });

      try {
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
          return res.status(401).json({ error: 'Password salah' });
        }

        // Generate unique session ID
        const sessionId = uuidv4();
        
        // Tentukan role untuk session ini
        // Jika deviceRole disediakan dan valid, gunakan itu
        // Jika tidak, gunakan role default user
        const validRoles = ['admin_kasir', 'admin_barang'];
        const sessionRole = (deviceRole && validRoles.includes(deviceRole)) ? deviceRole : user.role;

        // Create JWT token untuk session ini
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

        // Simpan session ke database
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
        const deviceName = req.body.deviceName || `Device-${sessionId.substring(0, 8)}`;

        db.run(
          `INSERT INTO sessions (id, user_id, device_name, ip_address, user_agent, token, role, expires_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [sessionId, user.id, deviceName, ipAddress, userAgent, token, sessionRole, expiresAt.toISOString()],
          (err) => {
            if (err) {
              console.error('Session creation error:', err);
              // Jika session gagal dibuat, tetap return token tapi log errornya
              return res.json({ 
                message: 'Login berhasil (session creation failed)',
                token,
                sessionId,
                user: { id: user.id, username: user.username, role: sessionRole }
              });
            }

            res.json({ 
              message: 'Login berhasil',
              token,
              sessionId,
              user: { id: user.id, username: user.username, role: sessionRole }
            });
          }
        );
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
};

// Logout - logout hanya session tertentu, bukan semua
exports.logout = async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.user?.sessionId;
    const token = req.headers.authorization?.split(' ')[1];

    if (!sessionId && !token) {
      return res.status(400).json({ error: 'Session ID atau token diperlukan' });
    }

    // Mark session as inactive di database
    db.run(
      `UPDATE sessions SET is_active = 0 WHERE (id = ? OR token = ?)`,
      [sessionId, token],
      (err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ error: 'Gagal logout' });
        }
        res.json({ message: 'Logout berhasil' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all active sessions untuk user tertentu
exports.getUserSessions = (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      `SELECT id, device_name, ip_address, role, created_at, last_activity, is_active 
       FROM sessions 
       WHERE user_id = ? AND is_active = 1 
       ORDER BY created_at DESC`,
      [userId],
      (err, sessions) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ sessions });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout device tertentu (untuk session management)
exports.logoutDevice = (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Validasi bahwa session milik user saat ini
    db.run(
      `UPDATE sessions SET is_active = 0 
       WHERE id = ? AND user_id = ?`,
      [sessionId, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Gagal logout device' });
        }
        res.json({ message: 'Device berhasil logout' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user
exports.getCurrentUser = (req, res) => {
  res.json(req.user);
};
