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
    const connected = await initDatabase();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    console.log('✓ Database connected');
    
    // Sync models ke database (alter: true = update existing tables, don't drop data)
    // Skip sync if no models are defined or if it fails
    try {
      const models = Object.keys(sequelize.models);
      if (models.length > 0) {
        const needsRebuild = process.env.FORCE_SYNC === 'true';
        if (needsRebuild) {
          console.log('🔄 Force rebuilding database schema...');
          await sequelize.sync({ force: true });
          console.log('✓ Database schema rebuilt');
        } else {
          await sequelize.sync({ alter: true });
          console.log('✓ Database tables synced');
        }
      } else {
        console.log('ℹ️ No models registered for sync');
      }
    } catch (syncError) {
      console.warn('⚠️ Database sync warning (non-critical):', syncError.message);
      // Don't fail on sync errors - app can work without schema sync
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

// Transaction/Sales routes (legacy)
app.use('/api/transactions', require('./routes/transactions'));

// RESTAURANT/CAFE POS ROUTES (NEW)
// Category management
app.use('/api/categories', require('./routes/categories'));

// Table management
app.use('/api/tables', require('./routes/tables'));

// Order management
app.use('/api/orders', require('./routes/orders'));

// Kitchen display system
app.use('/api/kitchen', require('./routes/kitchen'));

// Analytics & Reports (enhanced dashboard)
app.use('/api/analytics', require('./routes/analytics'));

// Reporting & Analytics routes (legacy)
app.use('/api/reports', require('./routes/reports'));

// Export routes (Excel, PDF)
app.use('/api/export', require('./routes/exports'));

// Dashboard routes (legacy)
app.use('/api/dashboard', require('./routes/dashboard'));

// Stock In (Barang Masuk) routes
app.use('/api/stockin', require('./routes/stockin'));

// ============ PAGE ROUTES ============
// Serve index.html for SPA routing
// Semua routes selain /api dan /uploads akan diarahkan ke frontend React
app.get('*', (req, res, next) => {
  // Jika request ke API, biarkan API handler yang handle (next)
  if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
    return next();
  }
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

// No 404 handler needed for pages as we use catch-all above, 
// but we handle missing API routes specifically.
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API Route not found', path: req.url });
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
