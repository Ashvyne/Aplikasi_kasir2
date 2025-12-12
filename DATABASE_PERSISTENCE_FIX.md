# ✅ Database Connection & Data Persistence - Fixed

## 🔧 Masalah yang Diselesaikan

### Masalah #1: Data Produk Hilang Saat Restart
**Penyebab:** Konfigurasi `force: true` di `sync()` yang menghapus semua tabel dan data setiap kali app start.

**Solusi:** Ubah ke `alter: true` - hanya update struktur tabel, jangan drop data.

```javascript
// ❌ SEBELUMNYA (drop semua data)
await sequelize.sync({ force: true });

// ✅ SEKARANG (preserve data)
await sequelize.sync({ alter: true });
```

### Masalah #2: Tabel Kosong di Database
**Penyebab:** Tidak ada initial seed data saat database pertama kali dibuat.

**Solusi:** Buat seed script yang otomatis menambahkan 10 produk awal jika database kosong.

## 📦 File yang Diubah

1. **src/app.js** (Line 93)
   - Changed: `sync({ force: true })` → `sync({ alter: true })`

2. **scripts/seed-initial-data.js** (BARU)
   - Script untuk seed 10 produk awal
   - Hanya berjalan jika database kosong

3. **package.json**
   - Added: `"seed:data": "node scripts/seed-initial-data.js"`

## 🚀 Cara Menggunakan

### Pertama Kali Setup
```bash
npm install
npm run seed:data    # Tambah 10 produk awal
npm start            # Start aplikasi
```

### Setelah Itu
```bash
npm start            # Akan preserve semua data yang sudah ada
```

## 📊 Initial Products (10 Produk)
```
1. Kopi Arabika      - Rp 25.000 (50 stock)
2. Teh Premium       - Rp 15.000 (75 stock)
3. Roti Tawar        - Rp 20.000 (30 stock)
4. Croissant         - Rp 18.000 (40 stock)
5. Donut Coklat      - Rp 10.000 (60 stock)
6. Juice Jeruk       - Rp 12.000 (45 stock)
7. Susu Sapi Murni   - Rp 18.000 (35 stock)
8. Sandwich Ayam     - Rp 22.000 (25 stock)
9. Muffin Blueberry  - Rp 16.000 (50 stock)
10. Brownies         - Rp 14.000 (55 stock)
```

## ✅ Verification

```bash
# Check products di database
mysql -u root kasir_modern -e "SELECT * FROM products;"

# Expected Output: 10 products dengan data lengkap
```

## 🔄 Data Flow

```
1. App Start
   ↓
2. Connect ke Database (kasir_modern di XAMPP)
   ↓
3. Sync Models dengan `alter: true` (preserve existing data)
   ↓
4. Ready untuk operasi (CRUD)
   ↓
5. Semua data otomatis tersimpan di MySQL
   ↓
6. Saat restart, semua data tetap ada ✅
```

## 📝 Catatan Penting

- **Production:** Gunakan proper backup strategy dan migrations
- **Development:** Aman menggunakan `alter: true`
- **Seed Data:** Hanya berjalan sekali saat table kosong
- **Manual Reseed:** `npm run seed:data` (akan skip jika data sudah ada)

---

**Status:** ✅ FIXED - Semua data sekarang tersimpan dengan baik di XAMPP MySQL!
