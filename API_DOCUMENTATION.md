# 🔌 API DOCUMENTATION - DETAIL ENDPOINTS

## Base URL
```
http://localhost:3000/api
```

## Authentication
Semua request (kecuali login & register) memerlukan JWT token di header:
```
Authorization: Bearer <token>
```

---

## 📋 TABLE OF CONTENTS
1. [Authentication](#1-authentication)
2. [Products](#2-products)
3. [Transactions](#3-transactions)
4. [Reports](#4-reports)
5. [Export](#5-export)

---

## 1️⃣ Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "cashier1",
  "email": "cashier@kasir.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "cashier1",
    "email": "cashier@kasir.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors (400):**
- `Username already exists`
- `Email already registered`
- `Password too weak (min 8 chars)`

---

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "cashier1",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "cashier1",
    "email": "cashier@kasir.com",
    "role": "cashier"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**Errors (401/400):**
- `Invalid username or password`
- `User not found`

---

### Verify Token
```http
GET /auth/verify
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "cashier1"
  }
}
```

**Response (401):**
```json
{
  "valid": false,
  "message": "Invalid or expired token"
}
```

---

## 2️⃣ Products

### Get All Products
```http
GET /products
Authorization: Bearer <token>
```

**Query Parameters:**
- `search`: Search by name/SKU
- `category`: Filter by category ID
- `page`: Pagination (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Lele Goreng",
      "sku": "FISH-001",
      "price": 25000,
      "stock": 50,
      "category_id": 5,
      "image_url": "/uploads/lele-1702375843123-abc123.jpg",
      "description": "Ikan lele goreng segar",
      "createdAt": "2025-12-01T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1
}
```

---

### Get Single Product
```http
GET /products/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "Lele Goreng",
    "sku": "FISH-001",
    "price": 25000,
    "stock": 50,
    "category_id": 5,
    "image_url": "/uploads/lele-1702375843123-abc123.jpg",
    "description": "Ikan lele goreng segar",
    "createdAt": "2025-12-01T10:30:00Z",
    "updatedAt": "2025-12-11T15:45:00Z"
  }
}
```

---

### Create Product
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nasi Goreng",
  "sku": "RICE-001",
  "price": 15000,
  "stock": 100,
  "category_id": 3,
  "description": "Nasi goreng dengan telur dan sayuran"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": 46,
    "name": "Nasi Goreng",
    "sku": "RICE-001",
    "price": 15000,
    "stock": 100,
    "category_id": 3,
    "createdAt": "2025-12-12T10:15:00Z"
  }
}
```

**Errors (400):**
- `Product name is required`
- `SKU must be unique`
- `Price must be positive number`
- `Stock must be non-negative`

---

### Update Product
```http
PUT /products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nasi Goreng Spesial",
  "price": 18000,
  "stock": 80,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "id": 46,
    "name": "Nasi Goreng Spesial",
    "price": 18000,
    "stock": 80,
    "updatedAt": "2025-12-12T10:20:00Z"
  }
}
```

---

### Delete Product
```http
DELETE /products/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Note:** Produk yang sudah ada di transaction tidak bisa didelete (soft delete recommended)

---

### Upload Product Image
```http
POST /products/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
  file: <image_file>
  productId: 1 (optional)
```

**Supported formats:** JPEG, PNG, GIF, WebP
**Max size:** 5MB

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "filename": "lele-1702375843123-abc123.jpg",
  "url": "/uploads/lele-1702375843123-abc123.jpg"
}
```

---

## 3️⃣ Transactions

### Get All Transactions
```http
GET /transactions
Authorization: Bearer <token>
```

**Query Parameters:**
- `search`: Search by invoice number
- `startDate`: Filter by date (YYYY-MM-DD)
- `endDate`: Filter by date range
- `paymentMethod`: Filter by Tunai/Kartu/Transfer
- `page`: Pagination
- `limit`: Items per page

**Response (200):**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "invoiceNumber": "INV-1765445549-PQ81E",
      "items": [
        {
          "id": 1,
          "name": "Lele Goreng",
          "quantity": 2,
          "price": 25000,
          "subtotal": 50000
        }
      ],
      "total": 50000,
      "discount": 0,
      "paymentMethod": "Tunai",
      "userId": 1,
      "createdAt": "2025-12-11T16:32:00Z"
    }
  ],
  "count": 25
}
```

---

### Get Transaction Detail
```http
GET /transactions/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "invoiceNumber": "INV-1765445549-PQ81E",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "name": "Lele Goreng",
        "quantity": 2,
        "price": 25000,
        "subtotal": 50000
      },
      {
        "id": 2,
        "product_id": 5,
        "name": "Es Teh",
        "quantity": 2,
        "price": 5000,
        "subtotal": 10000
      }
    ],
    "total": 60000,
    "discount": 0,
    "paymentMethod": "Tunai",
    "cash_received": 100000,
    "change_amount": 40000,
    "userId": 1,
    "createdAt": "2025-12-11T16:32:00Z"
  }
}
```

---

### Create Transaction (POS)
```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "name": "Lele Goreng",
      "quantity": 2,
      "price": 25000,
      "subtotal": 50000
    },
    {
      "product_id": 5,
      "name": "Es Teh",
      "quantity": 2,
      "price": 5000,
      "subtotal": 10000
    }
  ],
  "total": 60000,
  "discount": 0,
  "paymentMethod": "Tunai",
  "notes": "Untuk makan di sini"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "id": 1,
  "invoiceNumber": "INV-1765445549-PQ81E",
  "total": 60000,
  "transaction": {
    "id": 1,
    "invoiceNumber": "INV-1765445549-PQ81E",
    "items": [ ... ],
    "total": 60000,
    "createdAt": "2025-12-11T16:32:00Z"
  }
}
```

**Side Effects:**
- ✅ Auto-update product stock (reduce qty)
- ✅ Create transaction record
- ✅ Create transaction_items records
- ✅ Generate unique invoice number

**Errors (400/500):**
- `Items is required and must not be empty`
- `Total amount must be positive`
- `Insufficient stock for product X`
- `Product not found`

---

## 4️⃣ Reports

### Daily Sales Report
```http
GET /reports/daily
Authorization: Bearer <token>
```

**Query Parameters:**
- `date`: Specific date (YYYY-MM-DD) - default: today

**Response (200):**
```json
{
  "success": true,
  "date": "2025-12-11",
  "summary": {
    "total_transactions": 25,
    "total_revenue": 750000,
    "total_discount": 50000,
    "average_transaction": 30000
  },
  "transactions": [
    {
      "id": 1,
      "invoiceNumber": "INV-123",
      "total": 60000,
      "time": "16:32:00"
    }
  ]
}
```

---

### Top Products
```http
GET /reports/top-products
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: Top N products (default: 10)
- `period`: daily/weekly/monthly (default: monthly)

**Response (200):**
```json
{
  "success": true,
  "topProducts": [
    {
      "id": 1,
      "name": "Lele Goreng",
      "sku": "FISH-001",
      "total_qty": 157,
      "total_revenue": 3925000,
      "rank": 1
    },
    {
      "id": 5,
      "name": "Es Teh",
      "sku": "DRINK-001",
      "total_qty": 302,
      "total_revenue": 1510000,
      "rank": 2
    }
  ]
}
```

---

### Revenue by Date Range
```http
GET /reports/revenue?startDate=2025-12-01&endDate=2025-12-11
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "period": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-11"
  },
  "summary": {
    "total_revenue": 7500000,
    "total_transactions": 245,
    "average_daily": 682000
  },
  "dailyBreakdown": [
    {
      "date": "2025-12-11",
      "transactions": 25,
      "revenue": 750000
    }
  ]
}
```

---

### Stock Report
```http
GET /reports/stock
Authorization: Bearer <token>
```

**Query Parameters:**
- `threshold`: Low stock threshold (default: 20)
- `sort`: by_stock/by_name (default: by_stock)

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "total_items": 45,
    "ok": 35,
    "low": 8,
    "critical": 2
  },
  "inventory": [
    {
      "id": 1,
      "name": "Lele Goreng",
      "sku": "FISH-001",
      "stock": 5,
      "status": "critical",
      "price": 25000,
      "value": 125000
    },
    {
      "id": 5,
      "name": "Es Teh",
      "sku": "DRINK-001",
      "stock": 150,
      "status": "ok",
      "price": 5000,
      "value": 750000
    }
  ],
  "total_inventory_value": 1234567890
}
```

---

## 5️⃣ Export

### Export Sales to Excel
```http
POST /export/sales-excel
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-12-01",
  "endDate": "2025-12-11",
  "includeDetails": true
}
```

**Response:** File download (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- Filename: `sales_report_2025-12-11.xlsx`
- Contains: Invoice #, Date, Items, Total, Payment Method

---

### Export Sales to PDF
```http
POST /export/sales-pdf
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-12-01",
  "endDate": "2025-12-11"
}
```

**Response:** File download (application/pdf)
- Filename: `sales_report_2025-12-11.pdf`
- Contains: Formatted report with company header, summary, detailed transactions

---

### Export Inventory to Excel
```http
POST /export/inventory-excel
Authorization: Bearer <token>
```

**Response:** File download
- Filename: `inventory_report_2025-12-11.xlsx`
- Contains: Product list with stock status, price, value

---

## 📊 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error or missing required field"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User does not have permission"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (development only)"
}
```

---

## 🧪 Testing dengan Postman

1. **Create Postman Collection** `Kasir API`
2. **Create Variables:**
   - `base_url`: http://localhost:3000/api
   - `token`: (diisi setelah login)

3. **Setup Pre-request Script (untuk auto-login):**
```javascript
// Jalankan jika token belum ada
if (!pm.environment.get('token')) {
  pm.sendRequest({
    url: pm.environment.get('base_url') + '/auth/login',
    method: 'POST',
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        username: 'cashier1',
        password: 'password123'
      })
    }
  }, (err, response) => {
    if (!err) {
      var jsonData = response.json();
      pm.environment.set('token', jsonData.token);
    }
  });
}
```

4. **Setup Auth Header:**
```
Authorization: Bearer {{token}}
```

---

**Last Updated:** December 2025
**API Version:** 1.0.0
