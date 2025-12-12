# 📐 CODE ORGANIZATION & STANDARDS

## Folder Structure Best Practices

### Setiap module harus punya struktur:
```
module-name/
├── controller.js         ← Business logic
├── route.js              ← API endpoints
├── model.js              ← Database model
└── service.js (optional) ← Reusable functions
```

### Contoh: Product Module
```
src/
├── controllers/productController.js  ← GET/POST/PUT/DELETE logic
├── models/Product.js                 ← Sequelize model definition
├── routes/products.js                ← /api/products/* routes
└── services/productService.js        ← Helper functions
```

---

## 📝 Code Style Guide

### JavaScript Naming Conventions

#### Variables
```javascript
// ✅ GOOD - camelCase untuk variables
const productName = 'Lele Goreng'
const totalPrice = 25000
const isActive = true

// ❌ BAD
const product_name = 'Lele Goreng'  // snake_case di JS
const ProductName = 'Lele Goreng'   // PascalCase untuk classes only
```

#### Functions
```javascript
// ✅ GOOD - camelCase verbs
const calculateTotal = () => { }
const formatPrice = (price) => { }
const validateInput = (data) => { }

// ❌ BAD
const Calculate_Total = () => { }
const CALCULATE_TOTAL = () => { }
```

#### Classes & Constructors
```javascript
// ✅ GOOD - PascalCase
class ProductModel {
  constructor(name) {
    this.name = name
  }
}

// ❌ BAD
class productModel { }
class product_model { }
```

#### Constants
```javascript
// ✅ GOOD - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024
const DB_TIMEOUT = 30000
const DEFAULT_PAGE_SIZE = 20

// ❌ BAD
const max_file_size = 5 * 1024 * 1024
const maxFileSize = 5 * 1024 * 1024  // This is variable, not constant
```

### File Naming

#### Controllers
```
productController.js      ✅ Singular, camelCase
transactionController.js  ✅ Singular, camelCase
```

#### Routes
```
products.js               ✅ Plural, camelCase
transactions.js           ✅ Plural, camelCase
```

#### Models
```
Product.js                ✅ Singular, PascalCase
Transaction.js            ✅ Singular, PascalCase
```

---

## 🗂️ Comment Standards

### File Header
```javascript
/**
 * PRODUCT CONTROLLER
 * 
 * Handles all product-related operations
 * 
 * Functions:
 * - getAllProducts()     : Fetch all products
 * - getProductById()     : Fetch specific product
 * - createProduct()      : Create new product
 * - updateProduct()      : Update product
 * - deleteProduct()      : Delete product
 * - uploadProductImage() : Upload product image
 * 
 * Security:
 * - All routes require JWT authentication
 * - Input validation on all endpoints
 * - SQL injection prevention via parameterized queries
 */
```

### Function Documentation
```javascript
/**
 * Calculate total price with discount
 * 
 * @param {number} subtotal - Base price
 * @param {number} discount - Discount amount (optional)
 * @returns {number} Final total after discount
 * 
 * @example
 * calculateTotal(100000, 10000) // Returns 90000
 */
function calculateTotal(subtotal, discount = 0) {
  return subtotal - discount
}
```

### Inline Comments
```javascript
// ✅ GOOD - Explain WHY, not WHAT
const result = products.filter(p => p.stock > 10)
// Only show products with sufficient stock

// ❌ BAD - Obvious what code does
const result = products.filter(p => p.stock > 10)
// Filter products where stock is greater than 10
```

---

## ✅ Code Review Checklist

### Before Committing

```
[ ] Code follows naming conventions
[ ] No console.log() in production code
[ ] All functions have comments
[ ] Error handling implemented (try-catch)
[ ] Input validation present
[ ] No hardcoded values (use .env)
[ ] No sensitive data in code (passwords, keys)
[ ] Database queries parameterized
[ ] All API responses consistent format
[ ] Status codes correct (200, 201, 400, 401, 404, 500)
[ ] No duplicate code (DRY principle)
[ ] Functions < 50 lines (single responsibility)
[ ] Variable names descriptive (not a, b, c)
```

---

## 🔐 Security Checklist

### Backend
```
[ ] JWT token validation di semua protected routes
[ ] Password hashing dengan bcrypt (min 10 rounds)
[ ] SQL injection prevention (Sequelize parameterized)
[ ] XSS prevention (input sanitization)
[ ] CORS properly configured
[ ] File upload validation (type, size, name)
[ ] Error messages tidak expose sensitive info
[ ] Rate limiting implemented (jika diperlukan)
[ ] Environment variables untuk secrets
[ ] HTTPS/SSL enabled di production
```

### Frontend
```
[ ] Token stored securely (localStorage dengan caution)
[ ] XSS prevention (escapeHtml untuk user inputs)
[ ] CSRF tokens jika form tidak use SPA
[ ] No sensitive data di localStorage
[ ] API endpoints validate responses
[ ] File upload client-side validation
```

---

## 📊 Code Metrics

### Functions
```
Ideal Length:     < 50 lines
Max Parameters:   ≤ 5 parameters
Nesting Level:    ≤ 3 levels deep
Cyclomatic Complexity: ≤ 10
```

### Files
```
Ideal Size:       < 300 lines
Max Size:         ≤ 500 lines
Classes:          ≤ 200 lines per class
```

### Comments
```
Code-to-Comment Ratio: 3:1 (3 lines code per 1 comment)
Header Comments:      1 per file
Function Comments:    1 per function
Inline Comments:      Only for "why", not "what"
```

---

## 🧪 Testing Standards

### Unit Tests (untuk functions)
```javascript
describe('calculateTotal()', () => {
  it('should return correct total', () => {
    const result = calculateTotal(100000, 10000)
    expect(result).toBe(90000)
  })

  it('should handle zero discount', () => {
    const result = calculateTotal(100000)
    expect(result).toBe(100000)
  })

  it('should handle edge cases', () => {
    expect(calculateTotal(0)).toBe(0)
    expect(calculateTotal(100000, 0)).toBe(100000)
  })
})
```

### API Tests (dengan Postman/Jest)
```javascript
describe('GET /api/products', () => {
  it('should return products array', async () => {
    const response = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`)
    
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.products)).toBe(true)
  })
})
```

---

## 🚀 Performance Guidelines

### Database
```javascript
// ✅ GOOD - Use SELECT columns, add LIMIT
SELECT id, name, price FROM products LIMIT 20

// ❌ BAD - SELECT *, no LIMIT
SELECT * FROM products

// ✅ GOOD - Index frequently queried columns
CREATE INDEX idx_product_sku ON products(sku)

// ✅ GOOD - Use pagination untuk large datasets
SELECT * FROM products LIMIT 20 OFFSET 0
```

### API Responses
```javascript
// ✅ GOOD - Include only necessary fields
{
  id: 1,
  name: 'Product',
  price: 25000
}

// ❌ BAD - Include unnecessary data
{
  id: 1,
  name: 'Product',
  price: 25000,
  internalNotes: '...',
  debugInfo: '...',
  rawData: { ... }
}
```

### JavaScript/Frontend
```javascript
// ✅ GOOD - Debounce search input
const searchInput = document.getElementById('search')
searchInput.addEventListener('input', debounce(searchProducts, 300))

// ❌ BAD - Fire event setiap keystroke
searchInput.addEventListener('input', searchProducts)

// ✅ GOOD - Use async/await dengan try-catch
async function loadData() {
  try {
    const response = await fetch('/api/data')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error:', error)
  }
}

// ❌ BAD - Callback hell
fetch('/api/data')
  .then(r => r.json())
  .then(d => fetch('/api/other'))
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## 🔄 Workflow Standards

### Git Commit Messages
```
✅ GOOD
git commit -m "feat: add product search functionality"
git commit -m "fix: correct total calculation bug"
git commit -m "docs: update API documentation"

❌ BAD
git commit -m "update"
git commit -m "fix stuff"
git commit -m "asdf"
```

### Branch Naming
```
✅ GOOD
feature/product-search
fix/cart-calculation
docs/api-update

❌ BAD
new_feature
fix1
update
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing Done
- [ ] Unit tests passed
- [ ] API tests passed
- [ ] Manual testing

## Screenshots (if UI change)
[Screenshots here]
```

---

## 📋 Code Review Comments

### When reviewing others' code

#### ✅ GOOD comments
```
"Consider using destructuring for cleaner code:
const { id, name } = product"

"This could be extracted into a utility function to avoid duplication"

"Great implementation! Just a suggestion: could add error handling here"
```

#### ❌ BAD comments
```
"This is wrong"
"Why did you do it this way?"
"This code is bad"
"Just use X instead" (without explanation)
```

---

## 🛠️ Debugging Best Practices

### Browser DevTools
```javascript
// ✅ GOOD - Use meaningful console logs
console.log('Loading products:', { page, limit })
console.error('❌ Failed to load products:', error)

// ❌ BAD
console.log('data')
console.log(response)
console.log('test')
```

### Server Logging
```javascript
// ✅ GOOD - Structure logs dengan context
console.log('✓ Product created:', {
  productId: 123,
  name: 'Lele Goreng',
  timestamp: new Date().toISOString()
})

// ❌ BAD
console.log('Product created')
```

---

## 📚 Documentation Standards

### README.md
```
1. Project description
2. Features
3. Tech stack
4. Installation
5. Running the app
6. API documentation link
7. Deployment guide
8. Contributing guidelines
```

### Code Comments Ratio
```
Small function:   1 comment per function
Medium function:  1-2 inline comments
Large function:   3+ inline comments + complexity explanation
```

### Variable Names
```
✅ GOOD - Self-documenting
const userEmail = 'user@example.com'
const isProductAvailable = true
const maxRetries = 3

❌ BAD - Need comment to understand
const x = 'user@example.com'  // What is x?
const p = true                 // Boolean for what?
const m = 3                     // What does 3 represent?
```

---

## ✨ Module Export Pattern

### Controller Export
```javascript
// ✅ GOOD - Named exports
exports.getAllProducts = (req, res) => { }
exports.getProductById = (req, res) => { }
exports.createProduct = (req, res) => { }

// Used as:
const { getAllProducts, createProduct } = require('./controllers')
```

### Model Export
```javascript
// ✅ GOOD - Default export untuk model
module.exports = Product

// Used as:
const Product = require('./models/Product')
```

### Service Pattern
```javascript
// ✅ GOOD - Object with methods
const productService = {
  getAll: async () => { },
  getById: async (id) => { },
  create: async (data) => { }
}

module.exports = productService
```

---

## 🎯 Common Mistakes to Avoid

```
1. ❌ Hardcoded values
   ✅ Use constants atau .env

2. ❌ Missing error handling
   ✅ Try-catch / .catch() chains

3. ❌ No input validation
   ✅ Validate sebelum process

4. ❌ SQL injection risk
   ✅ Use parameterized queries

5. ❌ Unescaped HTML output
   ✅ escapeHtml() sebelum display

6. ❌ Storing passwords in plain text
   ✅ Hash dengan bcrypt

7. ❌ Exposed JWT secrets
   ✅ Use .env variables

8. ❌ Missing status codes
   ✅ Always return proper HTTP status

9. ❌ No logging
   ✅ Log important operations

10. ❌ Functions doing too much
    ✅ Single responsibility principle
```

---

**Last Updated**: December 2025
**Version**: 1.0.0
