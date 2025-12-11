require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Configuration for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    cb(null, `${name}-${timestamp}-${randomStr}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar (JPEG, PNG, GIF, atau WebP)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Make upload middleware available globally
app.locals.upload = upload;

// Initialize Database
let sequelize = null;
let dbInitialized = false;

(async () => {
  try {
    const { sequelize: db, initDatabase } = require('./config/database');
    sequelize = db;
    
    await initDatabase();
    console.log('✓ Database connected');
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✓ Database tables synced');
    
    dbInitialized = true;
  } catch (error) {
    console.error('⚠️ Database initialization error:', error.message);
    console.log('⚠️ Running without database - using demo data');
    dbInitialized = false;
  }
})();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// ============ ROUTES ============

// Routes untuk API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/export', require('./routes/exports'));

// Serve pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

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
    database: dbInitialized ? '✓ Connected' : '⚠️ Demo mode'
  });
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// ============ 404 HANDLER ============

app.use((req, res) => {
  if (req.url.startsWith('/api/')) {
    console.warn('❌ 404 API Not Found:', req.method, req.url);
    return res.status(404).json({ message: 'API Route not found', path: req.url });
  }
  
  console.warn('⚠️ Route not found:', req.method, req.url);
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
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🚀 Aplikasi Kasir Modern Runnin                    ║
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
