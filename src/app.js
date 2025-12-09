require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./config/database');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initDatabase();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', verifyToken, require('./routes/products'));
app.use('/api/transactions', verifyToken, require('./routes/transactions'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/exports', require('./routes/exports'));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`✓ Server berjalan di http://localhost:${PORT}`);
  console.log(`✓ Database initialized`);
});
