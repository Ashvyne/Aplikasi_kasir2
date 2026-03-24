# CaféPOS - Professional Restaurant/Cafe POS System

A modern, professional Point of Sale (POS) system built with **React + Tailwind CSS** frontend and **Node.js + Express** backend. Designed specifically for cafes and restaurants with all essential features.

## 🌟 Features

### 📊 Dashboard
- Orders today summary
- Revenue analytics with charts
- Active tables status
- Low stock alerts
- Weekly revenue trends
- Top-selling menu items
- Recent orders feed

### 🪑 Table Management
- Visual table status display (Available, Occupied, Reserved)
- Occupancy rate tracking
- Table capacity management
- Drag-drop table reassignment
- Bulk table creation

### 🛒 POS/Order System
- **Order Types**: Dine-in, Take-away, Delivery
- Product menu with categories
- Real-time search & filtering
- Quantity controls (±)
- Item-specific notes (e.g., "less sugar", "no spicy")
- Shopping cart with live totals

### 💳 Billing Features
- Automatic tax calculation (PPN 10%)
- Service charge options (5% default)
- Discount support
- Change calculation
- Multiple payment methods (Cash, Card, Digital, Split)
- Split bill functionality
- Merge orders capability

### 👨‍🍳 Kitchen Display System (KDS)
- Real-time order queue
- Order status flow (Pending → Cooking → Ready → Served)
- Item-level status tracking
- Urgent order alerts (orders waiting >5 mins)
- Audio/visual notifications

### 📦 Menu Management
- Full CRUD for categories
- Product management with images
- Price and stock management
- Availability status per product
- Category reordering

### 📜 Reports & Analytics
- Daily/Weekly/Monthly revenue reports
- Best-selling items analysis
- Payment method distribution
- Order type breakdown
- Customer statistics
- Detailed export (PDF/Excel)

### 🔔 Notifications
- Low stock alerts
- Order ready notifications
- Urgent kitchen alerts

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL / SQLite
- **Auth**: JWT
- **File Upload**: Multer

### Frontend Stack
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: Lucide Icons
- **Charts**: Recharts
- **PDF Export**: jsPDF + html2canvas

## 📁 Project Structure

```
kasir-node/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── categoryController.js      ✨ NEW
│   │   │   ├── tableController.js         ✨ NEW
│   │   │   ├── orderController.js         ✨ NEW (enhanced)
│   │   │   ├── kitchenController.js       ✨ NEW
│   │   │   ├── dashboardController.js     ✨ ENHANCED
│   │   │   └── ...
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js                ✨ NEW
│   │   │   ├── RestaurantTable.js         ✨ NEW
│   │   │   ├── Order.js                   ✨ NEW
│   │   │   ├── OrderItem.js               ✨ NEW
│   │   │   ├── KitchenOrder.js            ✨ NEW
│   │   │   └── index.js                   ✨ NEW (relationships)
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── categories.js              ✨ NEW
│   │   │   ├── tables.js                  ✨ NEW
│   │   │   ├── orders.js                  ✨ NEW
│   │   │   ├── kitchen.js                 ✨ NEW
│   │   │   ├── analytics.js               ✨ NEW
│   │   │   └── ...
│   │   ├── config/
│   │   ├── middleware/
│   │   └── app.js                         ✨ UPDATED
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx                ✨ NEW
    │   │   ├── Header.jsx                 ✨ NEW
    │   │   └── ...
    │   ├── pages/
    │   │   ├── LoginPage.jsx              ✨ NEW
    │   │   ├── DashboardPage.jsx          ✨ NEW
    │   │   ├── POSPage.jsx                ✨ NEW
    │   │   ├── TablesPage.jsx             ✨ NEW
    │   │   ├── KitchenPage.jsx            ✨ NEW
    │   │   ├── MenuPage.jsx               ✨ NEW
    │   │   └── ReportsPage.jsx            ✨ NEW
    │   ├── services/
    │   │   └── api.js                     ✨ NEW
    │   ├── context/
    │   │   └── store.js                   ✨ NEW (Zustand stores)
    │   ├── hooks/
    │   │   ├── useAuth.js                 ✨ NEW
    │   │   └── useBodyScroll.js           ✨ NEW
    │   ├── utils/
    │   │   └── helpers.js                 ✨ NEW
    │   ├── App.jsx                        ✨ NEW
    │   ├── main.jsx                       ✨ NEW
    │   └── index.css                      ✨ NEW
    ├── index.html                         ✨ NEW
    ├── package.json                       ✨ NEW
    ├── vite.config.js                     ✨ NEW
    ├── tailwind.config.js                 ✨ NEW
    └── postcss.config.js                  ✨ NEW
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (or use SQLite)
- npm or yarn

### Backend Setup

```bash
cd e:\Coding\kasir-node

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and update values
cp .env.example .env

# Run database migrations/setup
npm run db:create
npm run seed:data
npm run seed:users

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend runs on http://localhost:5173
# API proxy to http://localhost:3000/api
```

## 🔑 Default Credentials

```
Username: admin
Password: 123456
```

## 📋 Database Schema (New Tables)

### RestaurantTable
- Stores physical restaurant tables
- Status: available, occupied, reserved
- Tracks current order for occupied tables

### Category
- Menu categories (Food, Beverages, Snacks, etc.)
- Display order and colors
- Icon support

### Order (Enhanced)
- Complete order lifecycle tracking
- Order type (dine-in, take-away, delivery)
- Tax, service charge, discount calculations
- Status flow: pending → confirmed → cooking → ready → served → completed
- Kitchen status tracking

### OrderItem
- Individual items in an order
- Per-item notes and status
- Price snapshot at order time

### KitchenOrder
- Kitchen display system data
- Item-level preparation tracking
- Priority levels
- Timing data

## 🔗 API Endpoints

### Categories
```
GET    /api/categories              - Get all categories
POST   /api/categories              - Create category
GET    /api/categories/:id          - Get category
PUT    /api/categories/:id          - Update category
DELETE /api/categories/:id          - Delete category
POST   /api/categories/reorder/all  - Reorder categories
```

### Tables
```
GET    /api/tables                  - Get all tables
GET    /api/tables/stats/summary    - Get table statistics
GET    /api/tables/:id              - Get table details
POST   /api/tables                  - Create table
PUT    /api/tables/:id              - Update table
PATCH  /api/tables/:id/status       - Update table status
DELETE /api/tables/:id              - Delete table
POST   /api/tables/bulk/create      - Bulk create tables
```

### Orders
```
GET    /api/orders                  - Get all orders (with filters)
GET    /api/orders/today/list       - Get today's orders
POST   /api/orders                  - Create order
GET    /api/orders/:orderId         - Get order details
PUT    /api/orders/:orderId/status  - Update order status
POST   /api/orders/:orderId/items   - Add item to order
PUT    /api/orders/:orderId/items/:itemId - Update order item
DELETE /api/orders/:orderId/items/:itemId - Remove order item
POST   /api/orders/:orderId/payment - Process payment
DELETE /api/orders/:orderId         - Cancel order
```

### Kitchen/KDS
```
GET    /api/kitchen/active/list     - Get active kitchen orders
GET    /api/kitchen/urgent/list     - Get urgent orders
GET    /api/kitchen/stats/summary   - Get kitchen statistics
PATCH  /api/kitchen/:orderId/status - Update kitchen order status
PATCH  /api/kitchen/:orderId/items/:itemId/status - Update item status
PATCH  /api/kitchen/:orderId/start-cooking - Start cooking
PATCH  /api/kitchen/:orderId/complete - Complete order
```

### Analytics
```
GET    /api/analytics/summary              - Dashboard summary
GET    /api/analytics/revenue/analytics    - Revenue by period
GET    /api/analytics/revenue/hourly       - Hourly revenue today
GET    /api/analytics/products/top-selling - Top selling products
GET    /api/analytics/payments/distribution - Payment method distribution
GET    /api/analytics/orders/type-distribution - Order type breakdown
GET    /api/analytics/customers/stats      - Customer statistics
GET    /api/analytics/orders/recent        - Recent orders
GET    /api/analytics/reports/detailed     - Detailed report
```

## 🎨 Design System

### Color Palette
- **Primary**: #FFD700 (Accent Gold)
- **Accent**: #10B981 (Green), #50C878 (Emerald)
- **Background**: #0f0f0f (Dark), #1a1a1a (Darker), #2a2a2a (Light)

### Typography
- **Headers**: Poppins (Bold)
- **Body**: Inter (Regular)
- **Sizes**: 12px to 48px

### Components
- **Cards**: Rounded (12-16px), soft shadows, glassmorphism
- **Buttons**: 3 variants (Primary, Secondary, Danger/Success)
- **Inputs**: Dark with gold focus ring
- **Animations**: Smooth transitions, slide-in effects

## 📱 Responsive Design

- **Mobile**: 320px - 639px
- **Tablet**: 640px - 1023px
- **Desktop**: 1024px+

All pages are fully responsive with:
- Collapsible sidebar on mobile
- Touch-friendly buttons
- Optimized layouts for each screen size

## 🔐 Security

- JWT authentication for all API endpoints
- Password hashing with bcrypt
- CORS configuration
- Input validation on backend
- SQL injection prevention via ORM
- File upload restrictions (images only)

## 🧪 Testing

To test the system:

1. **Login** with admin credentials
2. **Create Tables** - Add 5-10 tables
3. **Create Categories** - Add Food, Beverages, Snacks
4. **Add Products** - Add menu items to categories
5. **Create Orders** - Start a dine-in order from POS
6. **Kitchen Display** - View in KDS, update statuses
7. **Payment** - Process payment and complete order
8. **Analytics** - View dashboard and reports

## 🚀 Deployment

### Backend (Production)
```bash
# Build for production
npm install --production

# Start with pm2
pm2 start src/app.js --name "cafepos-api"

# Configure .env for production
DB_DIALECT=mysql
NODE_ENV=production
JWT_SECRET=<very-long-random-string>
```

### Frontend (Production)
```bash
# Build
npm run build

# Output goes to dist/
# Deploy dist/ to web server (Nginx, Apache, etc.)
```

## 📝 Environment Variables

**Backend (.env)**
```
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cafepos_db
DB_USER=root
DB_PASSWORD=password

NODE_ENV=development
PORT=3000

JWT_SECRET=your-super-secret-key
JWT_EXPIRE=24h

CORS_ORIGIN=*
MAX_FILE_SIZE=5242880
```

**Frontend (.env, optional)**
```
VITE_API_URL=http://localhost:3000
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Sequelize ORM](https://sequelize.org/)
- [Zustand Store](https://github.com/pmndrs/zustand)

## 🐛 Troubleshooting

### Frontend won't connect to API
- Check backend is running on port 3000
- Verify CORS settings in .env
- Check Network tab in browser DevTools

### Login failing
- Ensure database is properly connected
- Check JWT_SECRET is set in .env
- Verify user exists in database

### Tables/Orders not showing
- Refresh the page
- Check browser console for errors
- Verify API endpoints are correct

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Create feature branches
2. Commit messages should be descriptive
3. Test thoroughly before submitting

## 📄 License

MIT License © 2024

## 📞 Support

For issues and support:
- Check documentation first
- Review API endpoint specification
- Check database connections
- Review error logs in terminal

---

**Happy POS-ing! 🍽️**

Last Updated: March 2024
