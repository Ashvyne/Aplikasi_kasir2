# 🏗️ ARCHITECTURE & MIGRATION OVERVIEW

Dokumentasi teknis tentang arsitektur aplikasi Kasir setelah migrasi ke MySQL.

---

## 📐 SYSTEM ARCHITECTURE

### Before (localStorage)
```
┌─────────────────────────────────┐
│      WEB BROWSER                │
│  ┌──────────────────────────┐   │
│  │  HTML + CSS + JS         │   │
│  │  Bootstrap UI            │   │
│  │  ApexCharts              │   │
│  ├──────────────────────────┤   │
│  │  localStorage            │   │ ← All data here (volatile!)
│  │  [products]              │   │
│  │  [transactions]          │   │
│  │  [users]                 │   │
│  │  [token]                 │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Problems:**
- ❌ Data lost on browser clear
- ❌ Single device only
- ❌ No backup mechanism
- ❌ Vulnerable to XSS attacks
- ❌ Can't scale to multiple users

---

### After (MySQL + Node.js Backend)
```
┌──────────────────────────────────────────────────────────────┐
│                    WEB BROWSER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (HTML + CSS + Vanilla JS)                  │   │
│  │  - Bootstrap 5 UI                                    │   │
│  │  - ApexCharts visualizations                         │   │
│  │  - localStorage (cache only)                         │   │
│  │  - Fetch API ← Calls backend                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP/REST API
                       │ (JSON payloads)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Node.js + Express)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js Routes & Controllers                     │   │
│  │  ├─ /api/auth (login, logout)                       │   │
│  │  ├─ /api/products (CRUD)                            │   │
│  │  ├─ /api/transactions (create, read)                │   │
│  │  ├─ /api/reports (analytics)                        │   │
│  │  └─ /api/stockin (manage stock)                     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Middleware                                          │   │
│  │  ├─ JWT Authentication                              │   │
│  │  ├─ Request validation                              │   │
│  │  ├─ Error handling                                  │   │
│  │  └─ CORS policy                                     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Business Logic (Controllers)                        │   │
│  │  ├─ Product management                              │   │
│  │  ├─ Transaction processing                          │   │
│  │  ├─ User authentication                             │   │
│  │  └─ Report generation                               │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Data Persistence (Sequelize ORM)                    │   │
│  │  - Automatic migrations                             │   │
│  │  - Model relationships                              │   │
│  │  - Query builders                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────────────────┘
                       │ SQL Queries
                       │ (MySQL protocol)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│               DATABASE (MySQL Server)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  kasir_db (Database)                                 │   │
│  │  ├─ users                                            │   │
│  │  │  ├─ id (PK)                                       │   │
│  │  │  ├─ email (UNIQUE)                               │   │
│  │  │  ├─ password (encrypted)                         │   │
│  │  │  ├─ role (admin_barang | admin_kasir)            │   │
│  │  │  └─ timestamps                                    │   │
│  │  │                                                   │   │
│  │  ├─ products                                         │   │
│  │  │  ├─ id (PK)                                       │   │
│  │  │  ├─ sku (UNIQUE, indexed)                        │   │
│  │  │  ├─ name, category                               │   │
│  │  │  ├─ buy_price, sell_price                        │   │
│  │  │  ├─ stock                                         │   │
│  │  │  ├─ image_url, expiry_date                       │   │
│  │  │  └─ timestamps                                    │   │
│  │  │                                                   │   │
│  │  ├─ transactions                                     │   │
│  │  │  ├─ id (PK)                                       │   │
│  │  │  ├─ invoiceNumber (UNIQUE)                       │   │
│  │  │  ├─ items (JSON)                                 │   │
│  │  │  ├─ total, discount                              │   │
│  │  │  ├─ paymentMethod, userId (FK)                  │   │
│  │  │  └─ timestamps (indexed)                         │   │
│  │  │                                                   │   │
│  │  ├─ stock_in                                        │   │
│  │  │  ├─ id (PK)                                       │   │
│  │  │  ├─ product_id (FK → products)                  │   │
│  │  │  ├─ quantity, notes                              │   │
│  │  │  └─ timestamps                                    │   │
│  │  │                                                   │   │
│  │  └─ sessions                                        │   │
│  │     ├─ id (PK)                                       │   │
│  │     ├─ user_id (FK → users)                        │   │
│  │     ├─ token (UNIQUE, indexed)                     │   │
│  │     ├─ expires_at                                   │   │
│  │     └─ device_name, ip_address                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Features:                                                   │
│  ✅ ACID compliance                                        │
│  ✅ Automatic backups                                      │
│  ✅ Multi-user concurrent access                          │
│  ✅ Data relationships & constraints                       │
│  ✅ Query optimization with indexes                       │
└──────────────────────────────────────────────────────────────┘
```

**Advantages:**
- ✅ Data persisted on server
- ✅ Multi-user support (concurrent transactions)
- ✅ Real-time data synchronization
- ✅ Automatic backups possible
- ✅ Better security (JWT + encryption)
- ✅ Scalable architecture
- ✅ Production-ready

---

## 🔄 DATA FLOW

### User Login Flow
```
1. User Input (Email + Password)
   └──> Frontend (index.html)
       └──> POST /api/auth/login
           └──> Backend (authController.js)
               ├─ Verify email exists
               ├─ Compare password (bcrypt)
               ├─ Generate JWT token
               └─> Return { token, user, role }
                   └──> Frontend stores in localStorage
                       └──> User redirected to dashboard
```

### Product Creation Flow
```
1. User Adds Product
   └──> Frontend Modal (index.html)
       └──> POST /api/products (with file upload)
           └──> Backend (productController.js)
               ├─ Validate JWT token
               ├─ Validate product data
               ├─ Upload image to /uploads
               ├─ Save product to MySQL
               └─> Return { success, productId }
                   └──> Frontend updates products list
                       └──> Show success notification
```

### Transaction Checkout Flow
```
1. User Clicks Checkout
   └──> Frontend Cart (app.js)
       └──> POST /api/transactions
           └──> Backend (transactionController.js)
               ├─ Validate JWT token
               ├─ Validate cart items & stock
               ├─ Deduct stock from products
               ├─ Create transaction record
               ├─ Save to MySQL
               └─> Return { invoiceNumber, receipt }
                   └──> Frontend shows receipt
                       └──> Print or download PDF
```

---

## 🗄️ DATABASE RELATIONSHIPS

```
┌─────────────┐           ┌──────────────────┐
│    users    │           │    sessions      │
├─────────────┤           ├──────────────────┤
│ id (PK)     │◄──1:N─────│ user_id (FK)     │
│ email       │           │ token            │
│ password    │           │ expires_at       │
│ role        │           │ device_name      │
└─────────────┘           └──────────────────┘


┌──────────────────┐      ┌──────────────────┐
│   products       │      │   stock_in       │
├──────────────────┤      ├──────────────────┤
│ id (PK)          │◄──1:N│ product_id (FK)  │
│ sku (UNIQUE)     │      │ quantity         │
│ name             │      │ notes            │
│ category         │      │ created_by       │
│ buy_price        │      │ created_at       │
│ sell_price       │      └──────────────────┘
│ stock            │
│ image_url        │      ┌──────────────────┐
│ expiry_date      │      │  transactions    │
└──────────────────┘      ├──────────────────┤
                          │ id (PK)          │
                          │ invoiceNumber    │
                          │ items (JSON)     │ ← Contains product details
                          │ total            │
                          │ userId (FK)      │
                          │ created_at       │
                          └──────────────────┘

relationships:
- users 1:N sessions (one user can have multiple sessions/devices)
- products 1:N stock_in (one product has many stock_in records)
- users 1:N transactions (one user has many transactions)
```

---

## 🔒 SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Browser)                │
│                                             │
│  ☑️ HTTPS only (production)                │
│  ☑️ localStorage stores JWT token          │
│  ☑️ Validates user input                   │
│  ☑️ SweetAlert2 for feedback               │
└────────────────┬────────────────────────────┘
                 │ 
        ☑️ JWT Token in Authorization Header
        ☑️ JSON payloads
        ☑️ CORS validation
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           BACKEND (Node.js)                 │
│                                             │
│  ☑️ JWT verification (authMiddleware)      │
│  ☑️ Input validation (body-parser)         │
│  ☑️ Password hashing (bcrypt)              │
│  ☑️ SQL injection prevention (Sequelize)   │
│  ☑️ CORS policy enforcement                │
│  ☑️ Rate limiting (optional)               │
│  ☑️ Error handling (no stack traces)       │
│  ☑️ Logging & monitoring                   │
└────────────────┬────────────────────────────┘
                 │
        ☑️ SQL with parameterized queries
        ☑️ Connection pooling
        ☑️ Encryption (if sensitive data)
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           DATABASE (MySQL)                  │
│                                             │
│  ☑️ User-level access control              │
│  ☑️ Data validation at DB level            │
│  ☑️ Constraints & relationships            │
│  ☑️ Automated backups                      │
│  ☑️ Encryption at rest (optional)          │
└─────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA (Detailed)

### users table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,         -- bcrypt hashed
  role VARCHAR(50) DEFAULT 'admin_kasir', -- admin_kasir | admin_barang
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
```

### products table
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'Lainnya',
  buy_price INT DEFAULT 0,         -- in IDR (Rupiah)
  sell_price INT DEFAULT 0,        -- in IDR (Rupiah)
  stock INT DEFAULT 0,
  discount INT DEFAULT 0,          -- percentage
  image_url TEXT,                  -- URL path
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sku ON products(sku);
CREATE INDEX idx_category ON products(category);
CREATE INDEX idx_stock ON products(stock);
```

### transactions table
```sql
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoiceNumber VARCHAR(50) UNIQUE NOT NULL,  -- INV-00001 format
  items JSON NOT NULL,                        -- [{ product_id, quantity, price, subtotal }, ...]
  total INT NOT NULL,                         -- final amount in IDR
  discount INT DEFAULT 0,                     -- discount amount in IDR
  paymentMethod VARCHAR(50) DEFAULT 'Tunai',  -- Tunai | Card | Transfer | etc
  userId INT DEFAULT 1,                       -- which cashier made transaction
  notes TEXT,                                 -- optional notes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_invoiceNumber ON transactions(invoiceNumber);
CREATE INDEX idx_created_at ON transactions(created_at);
CREATE INDEX idx_userId ON transactions(userId);
```

### stock_in table
```sql
CREATE TABLE stock_in (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,              -- which product
  quantity INT NOT NULL,                -- how much added
  notes TEXT,                           -- reason / notes
  created_by INT DEFAULT 1,             -- which user added
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relationships
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_product_id ON stock_in(product_id);
CREATE INDEX idx_created_at ON stock_in(created_at);
```

### sessions table
```sql
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,            -- UUID
  user_id INT NOT NULL,
  device_name VARCHAR(255),              -- "iPhone X", "Chrome on Windows", etc
  ip_address VARCHAR(45),                -- IPv4 or IPv6
  user_agent TEXT,                       -- Browser user agent
  token TEXT NOT NULL UNIQUE,            -- JWT token
  role VARCHAR(50),                      -- Cached for quick access
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,         -- When session expires
  is_active BOOLEAN DEFAULT 1,           -- Soft delete
  
  -- Relationships
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_user_id ON sessions(user_id);
CREATE INDEX idx_token ON sessions(token);
CREATE INDEX idx_expires_at ON sessions(expires_at);
```

---

## 🔄 MIGRATION PROCESS FLOW

```
┌─────────────────────────────────────────────┐
│  Step 1: Setup Database                     │
│  npm run db:setup                           │
├─────────────────────────────────────────────┤
│  - Connect to MySQL server                  │
│  - Create 'kasir_db' database               │
│  - Create 5 tables with relationships       │
│  - Insert default users (admin123)          │
│  - Insert sample products (5 items)         │
│  ✅ Output: Database ready                  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Step 2: Export from Browser                │
│  Run script in console (F12)                │
├─────────────────────────────────────────────┤
│  - Read all localStorage data               │
│  - Package as JSON object                   │
│  - Add metadata (timestamp, version)        │
│  - Download as .json file                   │
│  ✅ Output: kasir_backup_2026-01-22.json    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Step 3: Import to MySQL                    │
│  npm run db:import -- kasir_backup.json     │
├─────────────────────────────────────────────┤
│  - Read JSON file                           │
│  - Validate data format                     │
│  - Start SQL transaction                    │
│  - Insert/Update products table             │
│  - Insert/Update transactions table         │
│  - Commit transaction                       │
│  ✅ Output: Success message + counts        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Step 4: Verify & Test                      │
├─────────────────────────────────────────────┤
│  - Start server: npm run dev                │
│  - Login with default credentials           │
│  - Check products loaded                    │
│  - Check transactions visible               │
│  - Test create new product                  │
│  - Test create new transaction              │
│  ✅ Output: Application working             │
└─────────────────────────────────────────────┘
```

---

## 📈 PERFORMANCE CONSIDERATIONS

### Database Indexes
```sql
-- Fast lookups by SKU
CREATE INDEX idx_sku ON products(sku);

-- Fast lookups by category  
CREATE INDEX idx_category ON products(category);

-- Fast date range queries
CREATE INDEX idx_created_at ON transactions(created_at);

-- Fast lookups by token (authentication)
CREATE INDEX idx_token ON sessions(token);
```

### Query Optimization
- Sequelize auto-generates optimized queries
- Use `attributes` to select only needed columns
- Use `include` for eager loading relationships
- Pagination for large datasets

### Caching Strategy
- Frontend localStorage for session data
- Browser cache for static assets
- Database query cache (MySQL)
- Consider Redis for scaling (future)

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Development
```
localhost:3000
  - Single machine
  - SQLite or local MySQL
  - Hot reload enabled
  - Detailed logging
```

### Production
```
┌──────────────────────────────────────┐
│  Load Balancer / Reverse Proxy       │
│  (Nginx / Apache / Cloudflare)       │
├──────────────────────────────────────┤
│  PM2 Process Manager                 │
│  - Multiple Node.js instances        │
│  - Auto-restart on crash             │
│  - Load balancing                    │
├──────────────────────────────────────┤
│  MySQL Server                        │
│  - Replicated for HA                 │
│  - Automated backups                 │
│  - Performance monitoring            │
└──────────────────────────────────────┘
```

---

## 📚 TECH STACK SUMMARY

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Client-side)                         │
├─────────────────────────────────────────────────┤
│  • HTML5 (Semantic markup)                      │
│  • CSS3 + Bootstrap 5 (Responsive design)       │
│  • Vanilla JavaScript (ES6+)                    │
│  • Fetch API (HTTP requests)                    │
│  • ApexCharts (Data visualization)              │
│  • SweetAlert2 (User notifications)             │
│  • localStorage (Client-side cache)             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BACKEND (Server-side)                          │
├─────────────────────────────────────────────────┤
│  • Node.js (Runtime)                            │
│  • Express.js (Web framework)                   │
│  • Sequelize (ORM)                              │
│  • bcrypt (Password hashing)                    │
│  • JWT (Authentication)                         │
│  • Multer (File uploads)                        │
│  • dotenv (Configuration)                       │
│  • CORS (Cross-origin handling)                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  DATABASE (Data persistence)                    │
├─────────────────────────────────────────────────┤
│  • MySQL 5.7+ (Relational database)             │
│  • InnoDB (Transaction support)                 │
│  • UTF8MB4 (Unicode support)                    │
│  • Foreign keys (Data integrity)                │
│  • Indexes (Query performance)                  │
└─────────────────────────────────────────────────┘
```

---

**This architecture provides a solid foundation for scaling the Kasir application from a single-device tool to a production-ready POS system!** 🚀
