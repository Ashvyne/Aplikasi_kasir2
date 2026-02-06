# � Aplikasi Peminjaman Alat Modern

Aplikasi manajemen peminjaman alat berbasis web yang dirancang untuk mempermudah proses penyewaan/peminjaman alat, manajemen inventory alat, dan pencatatan transaksi peminjaman.  
Dibangun dengan **Node.js + Express + MySQL** (Backend) dan **Bootstrap + Vanilla JS** (Frontend).

---

## 📘 Deskripsi Proyek

Aplikasi ini menyediakan fitur lengkap untuk mengelola sistem peminjaman alat dengan:
- **Manajemen Alat/Equipment**: CRUD lengkap untuk alat yang dapat dipinjam
- **Manajemen Peminjam**: Database peminjam dengan verifikasi identitas
- **Transaksi Peminjaman**: Pencatatan peminjaman dengan tracking status
- **Pengembalian & Inspeksi**: Proses pengembalian dengan penilaian kondisi
- **Perhitungan Biaya**: Otomatis hitung biaya sewa, denda keterlambatan, dan biaya kerusakan
- **Dashboard Analitik**: Visualisasi data peminjaman dan status alat
- **Laporan**: Export dan analisis data peminjaman

Proyek ini cocok digunakan untuk:
- Toko penyewaan peralatan/tools
- Perpustakaan digital peralatan kantor/perusahaan
- Sistem peminjaman alat konstruksi
- Manajemen aset perusahaan dengan fitur peminjaman
- Learning project untuk Node.js + MySQL

---

## 🚀 Fitur Utama

### 🔧 Manajemen Alat/Equipment
- Tambah alat dengan detail lengkap (nama, kode, kategori, tarif sewa)
- Edit dan hapus alat
- Track ketersediaan unit
- Monitor kondisi alat
- Kategori dan lokasi penyimpanan

### 👥 Manajemen Peminjam
- Daftar peminjam dengan data lengkap
- Verifikasi identitas peminjam
- Kontak dan informasi organisasi
- Soft delete untuk peminjam inaktif
- Track riwayat peminjaman per peminjam

### 📦 Transaksi Peminjaman
- Buat peminjaman baru dengan validasi stok
- Assign alat ke peminjam
- Set tanggal pinjam dan jatuh tempo
- Track status peminjaman (Aktif, Terlambat, Selesai, Dibatalkan)
- Nomor referensi peminjaman otomatis

### 📋 Pengembalian Alat
- Proses pengembalian dengan tanggal
- Penilaian kondisi alat (Baik, Rusak Ringan, Rusak Berat, Hilang)
- Catatan kerusakan detail
- Otomatis hitung biaya perbaikan
- Update inventory setelah pengembalian

### 💰 Perhitungan Biaya
- **Biaya Sewa**: Otomatis berdasarkan durasi × tarif harian
- **Denda Keterlambatan**: 50% dari tarif harian per hari terlambat
- **Biaya Kerusakan**: Manual input berdasarkan kondisi pengembalian
- **Total Biaya**: Ringkasan lengkap per peminjaman

### 📊 Dashboard & Laporan
- KPI Cards: Total alat, total peminjam, peminjaman aktif, terlambat
- Grafik aktivitas peminjaman
- Distribusi status alat
- Laporan peminjaman berdasarkan alat
- Analisis durasi peminjaman

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v14+
- MySQL 5.7+
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Buat file `.env`:
```env
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peminjaman_alat
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### 3. Start Server
```bash
npm run dev
```

---

## 📚 API Endpoints

### Equipment
- `GET /api/equipment` - List alat
- `POST /api/equipment` - Tambah alat
- `PUT /api/equipment/:id` - Edit alat
- `DELETE /api/equipment/:id` - Hapus alat

### Borrowers
- `GET /api/borrowers` - List peminjam
- `POST /api/borrowers` - Tambah peminjam
- `PUT /api/borrowers/:id` - Edit peminjam
- `DELETE /api/borrowers/:id` - Hapus peminjam

### Loans
- `GET /api/loans` - List peminjaman
- `POST /api/loans` - Buat peminjaman
- `POST /api/loans/:id/return` - Proses pengembalian
- `POST /api/loans/:id/cancel` - Batalkan peminjaman

---

## 👥 Default Credentials

```
Email: admin@example.com
Password: 123456
```

---

## 🎨 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, ApexCharts
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: MySQL
- **Authentication**: JWT

---

Aplikasi Peminjaman Alat Modern ✨

Produk dengan stok hampir habis

---

## 🗂 Struktur Folder

```bash
Aplikasi_kasir2/
│
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── debug.js
├── products/
│   └── (data produk kalau ada)
├── index.html
├── README.md
└── .gitignore
``` :contentReference[oaicite:7]{index=7}
```
## 🛠 Teknologi yang Digunakan

| Layer | Teknologi | Fungsi |
|-------|-----------|--------|
| **Frontend** | HTML5, CSS3, Bootstrap 5 | UI/UX Responsive |
| **Frontend** | Vanilla JavaScript | Logic & Interaksi |
| **Frontend** | ApexCharts | Visualisasi Data |
| **Backend** | Node.js + Express | REST API Server |
| **Database** | MySQL | Data Persistence |
| **ORM** | Sequelize | Database Management |
| **Auth** | JWT + bcrypt | Authentication & Security |
| **Upload** | Multer | File Upload Handler |

## 🔧 Instalasi & Setup

### ✅ Prerequisites
- Node.js v14+ 
- MySQL Server (running)
- npm or yarn

### 📥 Installation Steps

**1. Clone Repository**
```bash
git clone <repository-url>
cd kasir-node
```

**2. Install Dependencies**
```bash
npm install
```

**3. Configure Environment**
Create `.env` file (copy from `.env.example`):
```env
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kasir_db
DB_USER=root
DB_PASSWORD=
NODE_ENV=development
PORT=3000
JWT_SECRET=your_secret_key_here
```

**4. Setup Database**
```bash
npm run db:setup
```

This will:
- Create MySQL database
- Create all tables (users, products, transactions, etc.)
- Insert default users & sample data

**5. Start Server**
```bash
npm run dev
```

**6. Open Browser**
Navigate to: `http://localhost:3000`

### 🔑 Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin_barang@kasir.local` | `admin123` | Admin Barang |
| `admin_kasir@kasir.local` | `admin123` | Admin Kasir |

---

## 🔄 Migrate dari localStorage ke MySQL

Jika sudah punya data di localStorage, lihat [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) untuk step-by-step migration instructions.

Quick start:
```bash
# Step 1: Export data dari browser (lihat guide)
# Step 2: Setup database
npm run db:setup

# Step 3: Import data
npm run db:import -- kasir_backup_2026-01-22.json
```

---

## 📊 Available Scripts

```bash
npm run start      # Run production server
npm run dev        # Run development with auto-reload
npm run db:setup   # Initialize MySQL database
npm run db:import  # Import data from JSON to MySQL
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction detail

### Reports
- `GET /api/reports/summary` - Get sales summary
- `GET /api/reports/daily` - Daily sales report
- `GET /api/reports/export` - Export data to Excel

---

## 📌 Folder Structure

```
kasir-node/
├── src/
│   ├── app.js                 # Express server entry
│   ├── config/
│   │   ├── database.js        # MySQL configuration
│   │   └── migrate.js         # Database migrations
│   ├── models/
│   │   ├── Product.js
│   │   ├── Transaction.js
│   │   └── StockIn.js
│   ├── controllers/           # Business logic
│   ├── routes/                # API endpoints
│   ├── middleware/            # Auth & validation
│   └── public/                # Frontend files
│       ├── index.html
│       ├── css/
│       ├── js/
│       └── uploads/           # User uploaded files
├── scripts/
│   ├── setup-database.js      # Database initialization
│   ├── import-localstorage-to-db.js  # Data migration
│   └── data/                  # Backup JSON files
├── .env                       # Configuration
├── package.json
└── README.md
```

---

## 🚀 Deployment

### Deploy ke Production

1. Update `.env`:
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Point to production MySQL database

2. Use process manager (pm2):
```bash
npm install -g pm2
pm2 start src/app.js --name kasir-app
```

3. Setup reverse proxy (Nginx/Apache)

---

## 📄 Documentation

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migrate data dari localStorage
- [.env.example](./.env.example) - Environment configuration template

---

## 🐛 Troubleshooting

### MySQL Connection Error
```
❌ Database connection error: ECONNREFUSED
```
- Check MySQL is running
- Verify `.env` credentials
- Ensure database exists: `CREATE DATABASE kasir_db;`

### Port Already in Use
```
❌ Error: listen EADDRINUSE :::3000
```
- Change PORT in `.env`
- Or kill process: `lsof -i :3000 | kill -9 <PID>`

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#-troubleshooting) for more troubleshooting

---

## 📈 Pengembangan Selanjutnya (Roadmap)

- ✅ Backend dengan Node.js + MySQL
- ✅ JWT Authentication
- ✅ Multi-user (admin_barang & admin_kasir)
- ⏳ Export PDF
- ⏳ Integrasi printer thermal
- ⏳ Barcode scanner hardware
- ⏳ Payment gateway integration (Midtrans, Stripe)
- ⏳ Mobile app (React Native)

## 🤝 Contributors

- Ashvyne
- Afdaan

## 🧑‍💻 Author  
Ash

GitHub: https://github.com/Ashvyne

---

## 📄 License

ISC License - Feel free to use for learning & commercial projects

GitHub: https://github.com/Ashvyne

