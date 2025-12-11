# 📸 Panduan Upload Gambar Produk

## Deskripsi Fitur
Fitur upload gambar produk memungkinkan Anda menambahkan foto untuk setiap produk yang akan ditampilkan di halaman POS.

## Cara Menggunakan

### 1️⃣ Menambah Produk Baru dengan Gambar

#### Langkah-langkah:
1. **Login** ke aplikasi dengan credential:
   - Username: `admin`
   - Password: `123456`

2. **Klik Menu "Produk"** di sidebar kiri

3. **Klik tombol "Tambah Produk"** (warna biru di kanan atas)

4. **Isi form produk:**
   - Nama Produk: *contoh: Nasi Goreng*
   - SKU: *contoh: NG001*
   - Kategori: *pilih dari dropdown*
   - Harga Jual: *masukkan harga dalam Rupiah*
   - Stok Awal: *masukkan jumlah stok*

5. **Upload Gambar Produk:**
   - Area dengan border putus-putus adalah untuk upload gambar
   - **Opsi 1:** Klik area tersebut untuk membuka file picker
   - **Opsi 2:** Drag & drop file gambar langsung ke area tersebut
   
6. **Preview Gambar:**
   - Setelah upload, preview gambar akan muncul
   - Jika ingin ganti gambar, klik "Hapus Gambar" lalu upload yang baru
   - Jika ingin skip, langsung klik "Simpan Produk"

7. **Klik "Simpan Produk"** untuk menyimpan

### 2️⃣ Edit Produk dengan Update Gambar

1. **Klik Menu "Produk"** di sidebar
2. **Cari produk yang ingin diedit** di tabel daftar produk
3. **Klik tombol Edit (pensil icon)** pada baris produk
4. **Modal akan terbuka dengan data produk lama**
5. **Gambar lama akan ditampilkan di area preview**
6. **Untuk ganti gambar:**
   - Klik "Hapus Gambar" jika ingin menghapus gambar lama
   - Atau langsung upload gambar baru (akan mengganti otomatis)
7. **Klik "Simpan Perubahan"** untuk simpan

### 3️⃣ Lihat Gambar di POS

1. **Klik Menu "POS"** di sidebar
2. **Produk dengan gambar akan menampilkan foto di product card**
3. **Jika belum ada gambar, akan menampilkan emoji kategori produk**
4. **Gambar akan otomatis di-crop sesuai ukuran card**

## Spesifikasi File Gambar

| Kriteria | Detail |
|----------|--------|
| **Format** | JPEG, PNG, GIF, WebP |
| **Ukuran Maksimal** | 5 MB |
| **Resolusi Rekomendasi** | 400x400px atau lebih |
| **Aspect Ratio** | Square (1:1) ideal, tapi bisa sembarang (akan di-crop) |

## Fitur Keamanan

✅ **File Type Validation** - Hanya file gambar yang diterima  
✅ **File Size Check** - Maksimal 5MB untuk keamanan  
✅ **Unique Filename** - Setiap file mendapat nama unik dengan timestamp  
✅ **Auto Cleanup** - File otomatis dihapus jika produk dihapus  
✅ **Error Handling** - File cleanup otomatis jika ada error saat upload  

## Troubleshooting

### ❌ Gambar tidak ditampilkan di POS
**Solusi:**
1. Pastikan sudah upload gambar saat tambah/edit produk
2. Refresh halaman (F5)
3. Check browser console (F12) untuk error messages

### ❌ Error "File harus berupa gambar"
**Solusi:**
1. Pastikan file adalah gambar (JPG, PNG, GIF, WebP)
2. Jangan upload file lain seperti PDF, DOC, dll

### ❌ Error "Ukuran file terlalu besar"
**Solusi:**
1. Kompres gambar menggunakan tools online
2. Ukuran file harus di bawah 5MB
3. Gunakan format yang lebih ringan (WebP atau PNG)

## Tips

💡 **Ukuran Gambar Optimal:**
- Untuk performa terbaik, gunakan gambar 400x400px atau 500x500px
- Ukuran file ideal: 100KB - 500KB per gambar

💡 **Naming Convention:**
- Setiap file gambar akan disimpan dengan format: `nama-timestamp-random.ext`
- Contoh: `nasi-1702332000000-abc123.jpg`

💡 **Lokasi Penyimpanan:**
- Semua gambar disimpan di folder: `src/public/uploads/`
- Akses via URL: `http://localhost:3000/uploads/nama-file.jpg`

## API Endpoint (untuk developer)

### Upload Gambar (Create)
```
POST /api/products
Content-Type: multipart/form-data

Body:
- name: string (required)
- sku: string (required)
- category: string (optional)
- price: number (required)
- stock: number (optional)
- image: file (optional, max 5MB)
```

### Update Gambar (Edit)
```
PUT /api/products/:id
Content-Type: multipart/form-data

Body:
- name: string
- sku: string
- category: string
- price: number
- stock: number
- image: file (optional, untuk ganti gambar)
```

### Hapus Produk (termasuk gambar)
```
DELETE /api/products/:id

Response: Gambar otomatis dihapus dari folder uploads
```

## Contoh cURL Commands

### Tambah produk dengan gambar:
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Nasi Goreng" \
  -F "sku=NG001" \
  -F "price=25000" \
  -F "stock=10" \
  -F "image=@/path/to/image.jpg"
```

### Update produk dengan gambar baru:
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Nasi Goreng Updated" \
  -F "price=30000" \
  -F "image=@/path/to/new-image.jpg"
```

---

**Status:** ✅ Fitur sudah production-ready  
**Last Updated:** December 2025
