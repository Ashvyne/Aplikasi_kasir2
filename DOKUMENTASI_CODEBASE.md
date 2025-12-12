# 📚 DOKUMENTASI CODEBASE - APLIKASI KASIR MODERN

## 📋 Daftar Isi
1. [Struktur Project](#struktur-project)
2. [Konfigurasi & Setup](#konfigurasi--setup)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Security Features](#security-features)
8. [Fitur Utama](#fitur-utama)

---

## 📁 Struktur Project

```
kasir-node/
├── src/                          # Source code utama
│   ├── app.js                    # Entry point aplikasi (Express server)
│   ├── config/                   # Konfigurasi aplikasi
│   │   ├── database.js           # Database configuration (Sequelize + MySQL/SQLite)
│   │   └── migrate.js            # Database migration tools
│   ├── controllers/              # Business logic untuk setiap modul
│   │   ├── authController.js     # Authentication & Authorization
│   │   ├── productController.js  # Manajemen produk
│   │   ├── transactionController.js  # Manajemen transaksi/penjualan
│   │   ├── reportController.js   # Report & analytics
│   │   └── exportController.js   # Export data (Excel, PDF)
│   ├── middleware/               # Custom middleware
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/                   # Database models (Sequelize ORM)
│   │   ├── Product.js
│   │   ├── Transaction.js
│   │   └── [models lainnya]
│   ├── routes/                   # API endpoints routing
│   │   ├── auth.js               # Auth routes (/api/auth)
│   │   ├── products.js           # Product routes (/api/products)
│   │   ├── transactions.js       # Transaction routes (/api/transactions)
│   │   ├── reports.js            # Report routes (/api/reports)
│   │   └── exports.js            # Export routes (/api/export)
│   └── public/                   # Static files & Frontend
│       ├── index.html            # Main dashboard HTML
│       ├── login.html            # Login page HTML
│       ├── css/
│       │   └── style.css         # All styling (light & dark mode)
│       ├── js/
│       │   ├── app.js            # Main frontend logic
│       │   ├── login.js          # Login logic
│       │   ├── debug.js          # Debug utilities
│       │   └── utils.js          # Utility functions
│       └── uploads/              # User uploaded images
├── scripts/                      # Utility scripts
│   ├── seed-product-images.js    # Database seeding
│   └── check-products.js         # Data validation
├── .env                          # Environment variables
├── package.json                  # Node dependencies
└── README.md                     # Setup instructions
```

---

## ⚙️ Konfigurasi & Setup

### Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database Selection
DB_DIALECT=mysql              # Options: mysql, sqlite

# MySQL Configuration (jika DB_DIALECT=mysql)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kasir_db
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Logging
DB_LOGGING=true               # Set false di production
```

### Instalasi & Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run migrate    # atau manual setup via XAMPP

# 3. Jalankan development server
npm run dev        # dengan auto-reload (nodemon)
# atau
npm start          # production mode

# 4. Akses aplikasi
http://localhost:3000
```

---

## 🏗️ Backend Architecture

### 1. **Entry Point (src/app.js)**
- Inisialisasi Express server
- Setup middleware (CORS, body-parser, static files)
- Multer configuration untuk upload gambar
- Database initialization
- Route mounting

### 2. **Database Configuration (src/config/database.js)**

**Features:**
- ✅ Dual database support (MySQL + SQLite)
- ✅ Connection pooling untuk performance
- ✅ Environment variable validation
- ✅ Query logging di development
- ✅ Error handling & reconnection

**Sequelize ORM:**
- Automatic table creation/updates (`alter: true`)
- Model synchronization
- Transaction support

### 3. **Models (src/models/)**

Menggunakan Sequelize ORM untuk database abstraction:

**Product Model:**
- id, name, sku, price, stock, category_id, image_url
- Associations dengan transactions via transaction_items

**Transaction Model:**
- id, invoiceNumber, items (JSON), total, discount
- paymentMethod, userId, timestamps
- Items disimpan sebagai JSON array untuk flexibility

**TransactionItem Model (junction table):**
- Links transactions ← products dengan quantity & subtotal

### 4. **Controllers (src/controllers/)**

Setiap controller handle business logic untuk module tertentu:

#### AuthController
```
POST   /api/auth/register     - Register user baru
POST   /api/auth/login        - Login & get JWT token
GET    /api/auth/verify       - Verify token validity
```

#### ProductController
```
GET    /api/products          - Get semua produk
GET    /api/products/:id      - Get detail produk
POST   /api/products          - Create produk baru
PUT    /api/products/:id      - Update produk
DELETE /api/products/:id      - Delete produk
POST   /api/products/upload   - Upload gambar produk
```

#### TransactionController
```
GET    /api/transactions      - Get semua transaksi
GET    /api/transactions/:id  - Get detail transaksi dengan items
POST   /api/transactions      - Create transaksi baru + update stock
```

#### ReportController
```
GET    /api/reports/daily     - Sales report harian
GET    /api/reports/top-products  - Top 10 produk terjual
GET    /api/reports/revenue   - Revenue by date range
GET    /api/reports/stock     - Stock report
```

#### ExportController
```
POST   /api/export/sales-excel     - Export sales data ke Excel
POST   /api/export/sales-pdf       - Export sales ke PDF
POST   /api/export/inventory-excel - Export inventory
```

### 5. **Routes (src/routes/)**

Mapping URL → Controller functions

**Route Protection:**
```
Semua route (kecuali login) dilindungi dengan JWT middleware
- Middleware cek token di Authorization header
- Validate token signature & expiry
- Attach user info ke request object
```

### 6. **Middleware (src/middleware/)**

**auth.js - JWT Authentication**
```
Middleware untuk protect routes:
- Extract token dari header
- Verify signature & expiry
- Return 401 jika invalid/expired
- Next() jika valid
```

---

## 🎨 Frontend Architecture

### 1. **HTML Structure (src/public/index.html)**

**Layout:**
```
Body
├── Sidebar Navigation (Fixed, 280px)
│   ├── Logo/Header
│   └── Menu items (POS, Products, Transactions, Reports)
├── Main Content
│   ├── Top Header (with user menu, dark toggle, time)
│   └── Pages Container (4 pages: POS, Products, Transactions, Reports)
└── Footer
```

**Pages:**
1. **POS Page** - Penjualan realtime
   - Products grid (searchable, filterable)
   - Shopping cart (add, remove, quantity)
   - Payment calculation (subtotal, discount, total, change)
   - Multiple payment methods

2. **Products Page** - Manajemen produk
   - Products table (sortable, searchable)
   - Add/Edit product modal
   - Image upload
   - Stock management

3. **Transactions Page** - History transaksi
   - Transactions table
   - View detail dengan modal
   - Filter & search

4. **Reports Page** - Analytics & reporting
   - Daily sales chart
   - Top products ranking
   - Revenue trends
   - Stock status

### 2. **CSS Styling (src/public/css/style.css)**

**Features:**
- ✅ Light & Dark mode support (CSS variables)
- ✅ Responsive design (mobile-first)
- ✅ Bootstrap 5 integration
- ✅ Custom animations & transitions
- ✅ Accessibility (WCAG AA)

**Color System:**
```css
Light Mode:
--bg-primary: #f8f9fa      /* Page background */
--bg-secondary: #ffffff    /* Card background */
--bg-tertiary: #f0f4f8     /* Section background */
--text-primary: #212529    /* Main text */

Dark Mode:
--bg-primary: #1a1a1a
--bg-secondary: #2d2d2d
--bg-tertiary: #3a3a3a
--text-primary: #e0e0e0
```

**Dark Mode Implementation:**
```html
<!-- Toggle button di header -->
<button id="darkModeToggle">🌙</button>

<!-- Applied via data attribute -->
<html data-theme="dark">
```

### 3. **JavaScript Logic (src/public/js/app.js)**

**Global Variables:**
```javascript
let products = []         // All products from API
let cart = []            // Shopping cart items
let transactions = []    // Transaction history
let isLoading = false    // Loading state
```

**Main Functions:**

#### POS Module
```
addToCart(productId)           - Tambah produk ke keranjang
removeFromCart(itemIndex)      - Hapus dari keranjang
updateCartQty(index, qty)      - Update quantity
calculateTotals()              - Hitung subtotal, diskon, total, kembalian
createTransaction()            - Submit transaksi ke backend
```

#### Products Module
```
loadProducts()                 - Fetch dari /api/products
displayProducts()              - Render products grid
searchProducts()               - Filter produk by name/sku
openProductModal()             - Modal untuk add/edit
saveProduct()                  - POST/PUT ke backend
deleteProduct(id)              - DELETE product
uploadProductImage()           - Handle image upload
```

#### Transactions Module
```
loadTransactions()             - Fetch dari /api/transactions
displayTransactions()          - Render transactions table
viewTransaction(id)            - Show detail via SweetAlert2
exportTransactionExcel()       - Export to Excel
```

#### Reports Module
```
loadReports()                  - Fetch analytics data
displaySalesChart()            - Render revenue chart (Chart.js)
displayTopProducts()           - Show best sellers
displayStockReport()           - Inventory status
```

#### Utilities
```
formatPrice(number)            - Format ke Rp currency
escapeHtml(text)               - Prevent XSS
generateInvoiceNumber()        - Create unique invoice
```

### 4. **Dark Mode Implementation**

**System:**
```javascript
// Toggle dark mode
toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme')
  const newTheme = current === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

// Apply dari localStorage saat load
applyTheme(localStorage.getItem('theme') || 'light')
```

**CSS Selectors:**
```css
/* Light mode default */
.element { color: black; }

/* Dark mode override */
[data-theme="dark"] .element { color: white; }
```

---

## 🗄️ Database Schema

### Tables

#### users
```
id (PK)          INT AUTO_INCREMENT
username         VARCHAR(255) UNIQUE
email            VARCHAR(255) UNIQUE
password         VARCHAR(255) BCRYPT
role             VARCHAR(50) [admin, cashier, manager]
createdAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updatedAt        TIMESTAMP
```

#### categories
```
id (PK)          INT AUTO_INCREMENT
name             VARCHAR(255)
description      TEXT
createdAt        TIMESTAMP
```

#### products
```
id (PK)          INT AUTO_INCREMENT
name             VARCHAR(255) NOT NULL
sku              VARCHAR(100) UNIQUE
price            INT (harga dalam Rupiah)
stock            INT DEFAULT 0
category_id (FK) INT
image_url        VARCHAR(255)
description      TEXT
createdAt        TIMESTAMP
updatedAt        TIMESTAMP
```

#### transactions
```
id (PK)          INT AUTO_INCREMENT
invoiceNumber    VARCHAR(50) UNIQUE
items            JSON (array of items purchased)
total            INT
discount         INT DEFAULT 0
paymentMethod    VARCHAR(50) [Tunai, Kartu, Transfer]
userId (FK)      INT
createdAt        TIMESTAMP
```

#### transaction_items (Junction Table)
```
id (PK)          INT AUTO_INCREMENT
transaction_id   INT (FK) → transactions.id
product_id       INT (FK) → products.id
quantity         INT
subtotal         INT
createdAt        TIMESTAMP
```

### Relationships

```
┌─────────────┐
│ users       │
└─────────────┘
      │
      │ (1 : M)
      ↓
┌──────────────────┐
│ transactions     │
└──────────────────┘
      │
      │ (1 : M)
      ↓
┌─────────────────────┐
│ transaction_items   │
└─────────────────────┘
      │
      │ (M : 1)
      ↓
┌──────────────┐
│ products     │
└──────────────┘
      │
      │ (M : 1)
      ↓
┌──────────────┐
│ categories   │
└──────────────┘
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register
       { username, email, password, confirmPassword }
       → { success, token, user }

POST   /api/auth/login
       { username, password }
       → { success, token, user }

GET    /api/auth/verify
       Headers: Authorization: Bearer <token>
       → { valid, user }
```

### Products
```
GET    /api/products
       → { success, products[] }

GET    /api/products/:id
       → { success, product }

POST   /api/products
       Body: { name, sku, price, stock, categoryId, description }
       → { success, product }

PUT    /api/products/:id
       Body: { name, price, stock, ... }
       → { success, product }

DELETE /api/products/:id
       → { success }

POST   /api/products/upload
       Form: { file: image }
       → { success, filename, url }
```

### Transactions
```
GET    /api/transactions
       → { success, transactions[] }

GET    /api/transactions/:id
       → { success, transaction (with items) }

POST   /api/transactions
       Body: { items[], total, discount, paymentMethod }
       → { success, invoiceNumber, transactionId }
       (Side effect: Update product stocks)
```

### Reports
```
GET    /api/reports/daily
       → { success, dailySales[] }

GET    /api/reports/top-products
       → { success, topProducts[] }

GET    /api/reports/revenue?startDate=&endDate=
       → { success, revenueData[] }

GET    /api/reports/stock
       → { success, stockReport[] }
```

### Export
```
POST   /api/export/sales-excel
       → Downloads: sales_report_[date].xlsx

POST   /api/export/sales-pdf
       → Downloads: sales_report_[date].pdf
```

---

## 🔐 Security Features

### 1. **Authentication & Authorization**
- ✅ JWT tokens (signed dengan secret key)
- ✅ Token expiry (7 hari default)
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ Role-based access control (RBAC)

### 2. **Data Protection**
- ✅ SQL Injection prevention (Sequelize parameterized queries)
- ✅ XSS prevention (escapeHtml function)
- ✅ CSRF tokens (implement jika diperlukan)
- ✅ CORS restrictions (allow specific origins)

### 3. **Input Validation**
- ✅ Email format validation
- ✅ Password strength requirements
- ✅ File type validation (images only)
- ✅ File size limits (5MB max)
- ✅ Numeric validation untuk prices/quantities

### 4. **Database Security**
- ✅ Environment variables untuk credentials
- ✅ Query logging disabled di production
- ✅ Connection pooling untuk prevent exhaustion
- ✅ Timeout pada long-running queries

### 5. **API Security**
- ✅ HTTPS ready (kan enable di production)
- ✅ Rate limiting (implement jika diperlukan)
- ✅ Request body size limits
- ✅ Helmet.js untuk security headers (optional)

---

## 💡 Fitur Utama

### 1. **Point of Sale (POS)**
- ✅ Real-time product search
- ✅ Add/remove items dari shopping cart
- ✅ Dynamic price calculation
- ✅ Multiple payment methods
- ✅ Automatic change calculation
- ✅ Invoice generation
- ✅ Transaction history

### 2. **Product Management**
- ✅ CRUD operations
- ✅ Image upload support
- ✅ Stock tracking
- ✅ Category classification
- ✅ SKU management
- ✅ Price history

### 3. **Transaction Management**
- ✅ Complete transaction history
- ✅ Invoice detail view
- ✅ Search & filter
- ✅ Payment method tracking
- ✅ Discount application
- ✅ Automatic stock deduction

### 4. **Reports & Analytics**
- ✅ Daily sales summary
- ✅ Top products ranking
- ✅ Revenue trends (chart)
- ✅ Inventory status
- ✅ Date range filtering

### 5. **Data Export**
- ✅ Excel export (.xlsx)
- ✅ PDF export (.pdf)
- ✅ Formatted reports
- ✅ Custom styling

### 6. **User Interface**
- ✅ Responsive design (mobile-friendly)
- ✅ Light & Dark mode toggle
- ✅ Modern UI with Bootstrap 5
- ✅ SweetAlert2 modals
- ✅ Chart.js visualizations
- ✅ Real-time clock display
- ✅ User authentication UI

---

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS
- [ ] Setup MySQL database (jika belum)
- [ ] Configure CORS origins
- [ ] Enable query logging disable
- [ ] Setup SSL certificates
- [ ] Configure backup strategy
- [ ] Setup monitoring & logging
- [ ] Test all endpoints

---

## 📝 Development Guide

### Adding New Feature

1. **Database**: Create model di `src/models/`
2. **API**: Create controller di `src/controllers/`
3. **Routes**: Add route di `src/routes/`
4. **Frontend**: Add HTML di `index.html`, logic di `app.js`
5. **Styling**: Add CSS di `style.css` (with dark mode)
6. **Testing**: Test endpoints dengan Postman

### Code Style

```javascript
// Comment untuk file purpose
/**
 * MODULE DESCRIPTION
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 */

// Comment untuk functions
function doSomething() {
  // Explain what this does
}

// Use const > let
const data = { /* ... */ }

// Use arrow functions
const process = (item) => item.id
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Database tidak connect**
- Check .env file existence
- Verify database server running
- Confirm credentials di .env

**Port sudah dipakai**
- Change PORT di .env
- Kill process: `lsof -ti:3000 | xargs kill -9`

**Module not found**
- Run `npm install`
- Check imports path

**CORS errors**
- Verify CORS middleware setup
- Check allowed origins

---

**Last Updated**: December 2025
**Version**: 1.0.0
