# ☕ CaféPOS — Sistem Kasir Modern untuk Café & Restoran

Aplikasi Point of Sale (POS) berbasis web yang lengkap dan modern, dibangun untuk memenuhi kebutuhan operasional café dan restoran. Mulai dari kasir, dapur, hingga pemesanan mandiri pelanggan — semua dalam satu sistem.

---

## ✨ Fitur Utama

### 👨‍💼 Admin & Kasir
- 🛒 **POS (Point of Sale)** — Input pesanan cepat dengan keranjang belanja, pilih metode bayar (Tunai, Kartu, QRIS), hitung kembalian otomatis, dan cetak struk
- 🪑 **Manajemen Meja** — Pantau status meja real-time (Tersedia / Terisi / Reservasi / Pembersihan), bayar pesanan langsung dari kartu meja, duplikat meja dengan satu klik
- 📦 **Manajemen Menu & Produk** — CRUD produk lengkap dengan upload foto, harga beli & jual, stok, dan kategori
- 📋 **Manajemen Stok** — Catat stok masuk, riwayat pengisian, dan alert produk mendekati habis
- 📊 **Dashboard Analitik** — Grafik pendapatan, pesanan per jam, produk terlaris, distribusi metode pembayaran
- 📈 **Laporan Penjualan** — Laporan detail per hari/bulan/periode dengan kemampuan ekspor

### 🍳 Staff Dapur
- 🔔 **Kitchen Display System** — Tampilan antrean pesanan real-time, update status masak (Pending → Cooking → Ready)

### 🧑‍🤝‍🧑 Pelanggan
- 📱 **Pesan Mandiri** — Pelanggan dapat scan QR / buka URL, login ke meja, pilih menu, dan checkout sendiri
- 🔍 **Pantau Status Pesanan** — Pelanggan bisa lihat status pesanan mereka secara real-time

---

## 🗂️ Struktur Proyek

```
kasir-node/
├── backend/                  ← Server API (Node.js + Express)
│   ├── src/
│   │   ├── app.js            ← Entry point server
│   │   ├── config/
│   │   │   └── database.js   ← Koneksi MySQL / SQLite
│   │   ├── models/           ← Definisi tabel Sequelize
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── RestaurantTable.js
│   │   │   ├── KitchenOrder.js
│   │   │   ├── Transaction.js
│   │   │   └── StockIn.js
│   │   ├── controllers/      ← Logika bisnis tiap fitur
│   │   ├── routes/           ← Endpoint API
│   │   └── middleware/       ← Auth JWT
│   └── scripts/              ← Script setup & seed data
│
└── frontend/                 ← Aplikasi React (Vite + Tailwind)
    └── src/
        ├── pages/            ← Halaman website
        ├── components/       ← Komponen reusable
        ├── context/          ← State global (Zustand)
        ├── services/         ← api.js (Axios)
        └── utils/            ← helpers.js
```

---

## 🚀 Cara Menjalankan (Setup Lokal)

### Prasyarat
- **Node.js** v18+
- **XAMPP** (MySQL aktif)
- **Git**

### Langkah 1 — Clone & Install

```bash
git clone <URL_REPOSITORY>
cd kasir-node

# Install backend
cd backend
npm install

# Install frontend (terminal baru)
cd ../frontend
npm install
```

### Langkah 2 — Konfigurasi Environment

```bash
# Di folder backend/
copy .env.example .env
```

Edit `backend/.env`:
```env
PORT=3000
NODE_ENV=development
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kasir_db
DB_USER=root
DB_PASSWORD=              # Kosong jika XAMPP default
JWT_SECRET=isi_dengan_string_acak_panjang_minimal_32_karakter
```

### Langkah 3 — Setup Database

Pastikan **MySQL XAMPP sudah Running**, lalu:

```bash
# Di folder backend/
npm run db:create     # Buat database kasir_db
npm run seed:users    # Buat tabel + akun default
```

### Langkah 4 — Jalankan Aplikasi

Buka **2 terminal sekaligus**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev           # → http://localhost:3000

# Terminal 2 — Frontend
cd frontend
npm run dev           # → http://localhost:5173
```

Buka browser: **http://localhost:5173**

---

## 🔑 Akun Default

Semua akun menggunakan password: **`password123`**

| Role | Username | Akses |
|---|---|---|
| **Admin** | `admin` | Semua fitur (Dashboard, Menu, Laporan, Pengaturan) |
| **Kasir** | `kasir` | POS, Manajemen Meja, Transaksi |
| **Dapur** | `dapur` | Kitchen Display |
| **Pelanggan** | `pelanggan` | Portal Pesan Mandiri `/customer/login` |

---

## 🌐 Peta Halaman

| URL | Halaman | Role |
|---|---|---|
| `/login` | Login Staff | Semua |
| `/dashboard` | Dashboard & Analitik | Admin |
| `/pos` | Kasir / POS | Admin, Kasir |
| `/tables` | Manajemen Meja | Admin, Kasir |
| `/menu` | Manajemen Menu & Produk | Admin |
| `/stock` | Manajemen Stok | Admin |
| `/reports` | Laporan Penjualan | Admin |
| `/kitchen` | Tampilan Dapur | Dapur |
| `/customer/login` | Login Pelanggan | Pelanggan |
| `/customer/menu` | Menu Mandiri Pelanggan | Pelanggan |
| `/customer/checkout` | Checkout Pelanggan | Pelanggan |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Backend Runtime** | Node.js v18+ |
| **Backend Framework** | Express.js |
| **ORM** | Sequelize |
| **Database** | MySQL (via XAMPP) / SQLite |
| **Autentikasi** | JWT (JSON Web Token) + bcrypt |
| **File Upload** | Multer |
| **Frontend Framework** | React 18 + Vite |
| **Styling** | Tailwind CSS |
| **Routing** | React Router DOM v6 |
| **HTTP Client** | Axios |
| **State Management** | Zustand |
| **Grafik** | Recharts |
| **Ikon** | Lucide React |
| **Animasi** | Framer Motion |
| **Notifikasi** | SweetAlert2 |
| **PDF/Export** | jsPDF, html2canvas |

---

## 📡 API Endpoints Utama

### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/login` | Login pengguna |
| POST | `/api/auth/logout` | Logout pengguna |
| GET | `/api/auth/me` | Data pengguna aktif |

### Produk & Kategori
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/products` | Daftar semua produk |
| POST | `/api/products` | Tambah produk baru |
| PUT | `/api/products/:id` | Update produk |
| DELETE | `/api/products/:id` | Hapus produk |
| GET | `/api/categories` | Daftar kategori |

### Pesanan
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/orders` | Daftar pesanan |
| POST | `/api/orders` | Buat pesanan baru |
| PUT | `/api/orders/:id/status` | Update status pesanan |
| POST | `/api/orders/:id/payment` | Proses pembayaran |

### Meja
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/tables` | Daftar meja |
| POST | `/api/tables` | Tambah meja |
| PATCH | `/api/tables/:id/status` | Update status meja |

### Dapur
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/kitchen/active/list` | Pesanan aktif dapur |
| PATCH | `/api/kitchen/:id/start-cooking` | Mulai masak |
| PATCH | `/api/kitchen/:id/complete` | Pesanan selesai |

### Analitik & Laporan
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/analytics/summary` | Ringkasan dashboard |
| GET | `/api/analytics/revenue/analytics` | Data pendapatan |
| GET | `/api/analytics/orders/recent` | Pesanan terbaru |
| GET | `/api/reports` | Laporan lengkap |

---

## ❗ Troubleshooting

| Masalah | Solusi |
|---|---|
| `ERR_CONNECTION_REFUSED` di browser | Pastikan `npm run dev` di folder `backend/` sudah berjalan |
| `Cannot connect to database` | Pastikan MySQL di XAMPP Control Panel sudah **Start** |
| Gambar produk tidak muncul | Pastikan server backend berjalan (gambar diambil dari `http://localhost:3000/uploads/`) |
| Error saat `seed:users` | Jalankan `npm run db:create` terlebih dahulu |
| Port 3000 sudah dipakai | Ganti `PORT` di `backend/.env` dan sesuaikan proxy di `frontend/vite.config.js` |

---

## 👥 Kontributor

- **Ashvyne** — https://github.com/Ashvyne
- **Afdaan**

---

## 📄 Lisensi

ISC License — Bebas digunakan untuk keperluan belajar maupun komersial.
