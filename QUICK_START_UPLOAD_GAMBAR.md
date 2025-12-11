# 🖼️ Fitur Upload Gambar Produk - Quick Start

## Status Saat Ini

✅ **Fitur upload gambar sudah aktif!**

- Produk sudah memiliki kolom untuk menyimpan gambar
- UI sudah siap untuk upload gambar
- Struktur folder `/uploads` sudah siap menerima file gambar

## Cara Cepat Upload Gambar

### 📸 Opsi 1: Upload Saat Edit Produk

1. **Buka menu "Produk"** di sidebar
2. **Klik Edit (ikon pensil)** pada produk yang ingin diberi gambar
3. **Scroll ke bagian "Foto Produk"**
4. **Klik area upload atau drag & drop gambar**
5. **Lihat preview gambar**
6. **Klik "Simpan Perubahan"**

### ➕ Opsi 2: Upload Saat Tambah Produk Baru

1. **Klik "Tambah Produk"** di halaman Produk
2. **Isi semua data produk**
3. **Di bagian "Foto Produk", upload gambar Anda**
4. **Klik "Simpan Produk"**

### 🎯 Hasil: Gambar Tampil di POS

- Setelah upload, buka halaman **"POS"**
- Gambar produk akan muncul di **product card**
- Gambar akan **auto-crop** sesuai ukuran card

## Spesifikasi File

| Aspek | Detail |
|-------|--------|
| Format | JPG, PNG, GIF, WebP |
| Ukuran Max | 5 MB |
| Resolusi Ideal | 400x400px atau lebih |

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Gambar tidak muncul | Refresh halaman (F5) atau cek ukuran file |
| Error upload | Pastikan file <5MB dan format gambar (JPG/PNG) |
| Gambar tidak tampil di POS | Pastikan file gambar berhasil terupload |

## Tips Menggunakan

💡 **Klik area upload** untuk membuka file picker  
💡 **Drag & drop gambar** langsung ke area upload  
💡 **Klik "Hapus Gambar"** untuk ganti gambar baru  
💡 **Gunakan gambar square (1:1)** untuk hasil terbaik  

---

## Contoh Struktur File

```
kasir-node/
├── src/
│   └── public/
│       └── uploads/              ← Folder tempat gambar disimpan
│           ├── nasi-goreng.jpg
│           ├── mie-ayam.jpg
│           └── es-teh.jpg
└── ...
```

## API Info (Developer)

Semua endpoint sudah support file upload dengan `multipart/form-data`:

- `POST /api/products` - Tambah produk + upload gambar
- `PUT /api/products/:id` - Edit produk + ganti gambar
- `DELETE /api/products/:id` - Hapus produk + file gambar otomatis dihapus

---

**Status:** ✅ Production Ready  
**Terakhir Update:** Desember 2025
