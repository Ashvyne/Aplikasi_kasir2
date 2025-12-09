const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, 'cashier'],
      function(err) {
        if (err) return res.status(400).json({ error: 'Username atau email sudah terdaftar' });
        res.status(201).json({ message: 'User berhasil dibuat', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
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

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ 
          message: 'Login berhasil',
          token,
          user: { id: user.id, username: user.username, role: user.role }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
};

// Get current user
exports.getCurrentUser = (req, res) => {
  res.json(req.user);
};
