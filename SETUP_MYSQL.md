# 🗄️ Setup MySQL dengan XAMPP

Panduan lengkap untuk mengkonfigurasi aplikasi Kasir Modern dengan MySQL menggunakan XAMPP.

---

## 📋 Persyaratan

- XAMPP terinstall
- Node.js terinstall
- npm atau yarn

---

## 🚀 Langkah-Langkah Setup

### 1️⃣ Jalankan XAMPPb
1. Buka **XAMPP Control Panel**
2. Klik **Start** pada Apache (opsional, jika diperlukan)
3. Klik **Start** pada MySQL

Pastikan status MySQL adalah **Running** (warna hijau).

**Default Port MySQL XAMPP:** `3306`

---

### 2️⃣ Buat Database

#### Menggunakan phpMyAdmin (GUI)

1. Buka browser, akses: `http://localhost/phpmyadmin`
2. Login dengan:
   - Username: `root`
   - Password: (kosong)
3. Klik **New** di sidebar kiri
4. Masukkan nama database: `kasir_modern`
5. Pilih charset: `utf8mb4_general_ci`
6. Klik **Create**

#### Menggunakan Command Prompt (CLI)

```bash
mysql -u root -p
# Tekan Enter jika password kosong

CREATE DATABASE kasir_modern CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
EXIT;
```

---

### 3️⃣ Konfigurasi File `.env`

File `.env` sudah dikonfigurasi dengan setting XAMPP default:

```env
# MySQL Configuration (XAMPP)
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kasir_modern
DB_USER=root
DB_PASSWORD=
```

**Jika MySQL XAMPP menggunakan password**, ubah:
```env
DB_PASSWORD=your_mysql_password
```

---

### 4️⃣ Jalankan Aplikasi

```bash
cd e:\Coding\kasir-node

# Install dependencies (jika belum)
npm install

# Jalankan aplikasi
npm start
```

Expected output:
```
✓ Database connected successfully (MYSQL)
  Host: localhost
  Database: kasir_modern
✓ Database tables synced
✓ Server running on port 3000
```

---

## 🔍 Troubleshooting

### ❌ Error: "ECONNREFUSED 127.0.0.1:3306"

**Solusi:**
1. Pastikan MySQL XAMPP sudah dijalankan
2. Periksa port di XAMPP Control Panel
3. Default XAMPP MySQL port: **3306**

### ❌ Error: "Access denied for user 'root'@'localhost'"

**Solusi:**
1. Update password di `.env` jika ada
2. Atau reset MySQL password XAMPP (lihat dokumentasi XAMPP)

### ❌ Error: "Database 'kasir_modern' doesn't exist"

**Solusi:**
1. Pastikan database sudah dibuat di phpMyAdmin
2. Atau jalankan SQL command di atas

### ❌ Error: "no such column: createdAt"

**Solusi:**
Ini biasanya terjadi jika menggunakan database lama dari SQLite.
- Jalankan aplikasi, maka Sequelize akan otomatis membuat schema baru
- Atau delete database lama dan buat yang baru

---

## 📊 Memverifikasi Connection

1. Buka browser: `http://localhost:3000`
2. Login dengan akun default (jika ada)
3. Buka tab **Network** di DevTools (F12)
4. Akses halaman apapun
5. Pastikan request API berhasil (status 200)

---

## 🔧 Konfigurasi Advanced

### Mengubah Port MySQL

Jika MySQL XAMPP menggunakan port berbeda (misal 3307):

```env
DB_PORT=3307
```

### Menggunakan User MySQL Berbeda

```env
DB_USER=your_username
DB_PASSWORD=your_password
```

### Enable Query Logging (Debug)

Edit `src/config/database.js`, ubah `logging: false` menjadi:

```javascript
logging: console.log  // Tampilkan semua SQL queries
```

---

## ✅ Checklist Sebelum Production

- [ ] XAMPP MySQL running
- [ ] Database `kasir_modern` sudah dibuat
- [ ] File `.env` sudah dikonfigurasi
- [ ] `npm install` sudah dijalankan
- [ ] Aplikasi bisa diakses di `http://localhost:3000`
- [ ] Database ter-sync (tabel terbuat otomatis)
- [ ] API endpoint merespons dengan data

---

## 📝 Backup Database

### Backup menggunakan phpMyAdmin

1. Akses `http://localhost/phpmyadmin`
2. Pilih database `kasir_modern`
3. Klik **Export**
4. Pilih format **SQL**
5. Klik **Go**

### Backup menggunakan Command Line

```bash
mysqldump -u root -p kasir_modern > kasir_modern_backup.sql
```

---

## 🚀 Selesai!

Aplikasi Kasir Modern Anda sekarang terhubung dengan MySQL XAMPP!

Jika ada pertanyaan atau masalah, periksa:
- Status XAMPP Control Panel
- File `.env` configuration
- phpMyAdmin untuk memverifikasi database
