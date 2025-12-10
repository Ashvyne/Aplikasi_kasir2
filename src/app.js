require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const { sequelize, initDatabase } = require('./config/database');
const { runMigrations } = require('./config/migrate');
const { verifyToken } = require('./middleware/authMiddleware');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
(async () => {
  try {
    await initDatabase();
    await sequelize.sync({ alter: true }); // Auto sync models
    console.log('✓ Database tables synced');
  } catch (error) {
    console.error('❌ Database sync error:', error);
  }
})();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ ROUTES (HARUS SEBELUM 404 HANDLER) ============

// Routes untuk API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reports', require('./routes/reports'));

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve index page
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '✓ Server running' });
});

// Chrome DevTools well-known
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// ============ 404 HANDLER (HARUS DI PALING AKHIR) ============

// 404 handler
app.use((req, res) => {
  // Untuk request API yang tidak ditemukan
  if (req.url.startsWith('/api/')) {
    console.warn('❌ 404 API Not Found:', req.method, req.url);
    return res.status(404).json({ message: 'API Route not found', path: req.url });
  }
  
  // Untuk request halaman, redirect ke index.html
  console.warn('⚠️ Route not found, redirecting to index.html:', req.method, req.url);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ ERROR HANDLER ============

// Error handler (HARUS PALING AKHIR)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error'
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🚀 Aplikasi Kasir Modern Running                ║
║                                                            ║
║  Server: http://localhost:${PORT}                          ║
║  Login:  http://localhost:${PORT}/login                    ║
║  Dashboard: http://localhost:${PORT}/                      ║
║                                                            ║
║  Demo Credentials:                                         ║
║  • Username: admin                                         ║
║  • Password: 123456                                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  console.log('📍 API Endpoints:');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/products');
  console.log('   POST   /api/products');
  console.log('   PUT    /api/products/:id');
  console.log('   PUT    /api/products/:id/reduce-stock ✓ NEW');
  console.log('   DELETE /api/products/:id');
  console.log('   GET    /api/transactions');
  console.log('   POST   /api/transactions');
  console.log('   GET    /api/reports');
  console.log('   GET    /api/health');
});
