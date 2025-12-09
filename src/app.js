require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./config/database');
const { runMigrations } = require('./config/migrate');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database and Migrations
initDatabase();
runMigrations();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reports', verifyToken, require('./routes/reports'));
app.use('/api/exports', verifyToken, require('./routes/exports'));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
});

// Delay server start untuk tunggu migration
setTimeout(() => {
  app.listen(PORT, () => {
    console.log(`\n✓ Server berjalan di http://localhost:${PORT}`);
    console.log(`✓ Database siap`);
    console.log(`✓ Ready untuk digunakan!\n`);
    console.log('Akses: http://localhost:3000/login\n');
  });
}, 1000);
