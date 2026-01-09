/**
 * APLIKASI KASIR MODERN - SERVER UTAMA
 * 
 * Entry point untuk Express.js server
 * 
 * Features:
 * ✅ REST API untuk backend operations
 * ✅ Static file serving (HTML, CSS, JS, images)
 * ✅ Multer untuk image upload
 * ✅ JWT authentication middleware
 * ✅ CORS untuk cross-origin requests
 * ✅ Database initialization & synchronization
 * 
 * PORT: 3000 (default) | configurable via .env
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ UPLOAD CONFIGURATION ============
// Setup directory untuk user uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer - Konfigurasi untuk upload gambar produk
const storage = multer.diskStorage({
  // Tujuan simpan file
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  // Format nama file: name-timestamp-random.ext
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    cb(null, `${name}-${timestamp}-${randomStr}${ext}`);
  }
});

// Filter file type - hanya image yang diizinkan
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar (JPEG, PNG, GIF, atau WebP)'));
  }
};

// Inisialisasi multer dengan config
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB
});

// Make upload middleware available globally
app.locals.upload = upload;

// ============ DATABASE INITIALIZATION ============
/**
 * Initialize database connection
 * - Support MySQL dan SQLite (selectable via .env)
 * - Auto-create tables jika belum ada
 * - Sync models dengan database
 */
let sequelize = null;
let dbInitialized = false;

(async () => {
  try {
    const { sequelize: db, initDatabase } = require('./config/database');
    sequelize = db;
    
    // Connect ke database
    await initDatabase();
    console.log('✓ Database connected');
    
    // Sync models ke database (alter: true = update existing tables, don't drop data)
    // First time: force rebuild to ensure schema is clean
    const needsRebuild = process.env.FORCE_SYNC === 'true';
    if (needsRebuild) {
      console.log('🔄 Force rebuilding database schema...');
      await sequelize.sync({ force: true });
      console.log('✓ Database schema rebuilt');
    } else {
      await sequelize.sync({ alter: true });
      console.log('✓ Database tables synced');
    }
    
    dbInitialized = true;
  } catch (error) {
    console.error('⚠️ Database initialization error:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    console.log('⚠️ Running without database - using demo data');
    dbInitialized = false;
  }
})();

// ============ MIDDLEWARE SETUP ============
// Enable CORS untuk frontend dapat akses API
app.use(cors());

// Parse JSON dan form data (max 50MB untuk large file transfers)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files dari public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploads folder
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'deny',
  index: false
}));

// ============ API ROUTES ============
// Semua route menggunakan JWT authentication middleware

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// Product management routes
app.use('/api/products', require('./routes/products'));

// Transaction/Sales routes
app.use('/api/transactions', require('./routes/transactions'));

// Reporting & Analytics routes
app.use('/api/reports', require('./routes/reports'));

// Export routes (Excel, PDF)
app.use('/api/export', require('./routes/exports'));

// Dashboard routes
app.use('/api/dashboard', require('./routes/dashboard'));

// Stock In (Barang Masuk) routes
app.use('/api/stockin', require('./routes/stockin'));

// ============ PAGE ROUTES ============
// Serve HTML pages

// Login pages - Role selection
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login Admin Barang
app.get('/login-barang', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-barang.html'));
});

app.get('/login-barang.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-barang.html'));
});

// Login Admin Kasir
app.get('/login-kasir', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-kasir.html'));
});

app.get('/login-kasir.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-kasir.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard page routes - serve index.html dan biarkan frontend handle routing dengan JavaScript
// Semua routes ini serve file yang sama (index.html) - SPA pattern
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stockin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stock', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/pos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/transactions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Main dashboard (default)
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: '✓ Server running',
    database: dbInitialized ? '✓ Connected' : '⚠️ Demo mode',
    uploadsDir: uploadsDir,
    uploadsExists: fs.existsSync(uploadsDir)
  });
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// ============ 404 HANDLER ============
// Main index route - check auth dan redirect accordingly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  // Don't log 404 for static files (images, css, js, etc) - they should be handled by express.static
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticFile = staticExtensions.some(ext => req.url.toLowerCase().includes(ext));
  const isUploadRequest = req.url.toLowerCase().startsWith('/uploads/');
  
  if (req.url.startsWith('/api/')) {
    console.warn('❌ 404 API Not Found:', req.method, req.url);
    return res.status(404).json({ message: 'API Route not found', path: req.url });
  }
  
  // Only log non-static file 404s
  if (!isStaticFile && !isUploadRequest) {
    console.warn('⚠️ Route not found:', req.method, req.url);
  }
  
  // Serve index.html for SPA routing
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ ERROR HANDLER ============

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error'
  });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                 🚀Aplikasi Kasir Modern Berjalan!                   ║
║                                                                      ║
║   Server     : http://localhost:${PORT}                              ║
║   Login      : http://localhost:${PORT}/login                        ║
║   Dashboard  : http://localhost:${PORT}/                             ║
║                                                                      ║
║   Demo Credentials:                                                  ║
║     • Username : admin                                               ║
║     • Password : 123456                                              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  console.log('📍 API Endpoints:');
  console.log('   GET    /api/health');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/products');
  console.log('   POST   /api/products');
  console.log('   PUT    /api/products/:id');
  console.log('   PUT    /api/products/:id/reduce-stock');
  console.log('   DELETE /api/products/:id');
  console.log('   GET    /api/transactions');
  console.log('   POST   /api/transactions');
  console.log('   GET    /api/reports');
  console.log('   GET    /api/export/sales-excel');
  console.log('   GET    /api/export/products-excel');
});
