# 🎓 PANDUAN LENGKAP PRESENTASI CAFÉPOS
_(Bahan Hafalan Sidang / Wawancara / Presentasi Project)_

Dokumen ini adalah rekapan komprehensif mengenai keseluruhan proyek **CaféPOS**. Pelajari dan hafalkan poin-poin di bawah ini untuk menguasai alur aplikasi, peran (roles), teknologi yang digunakan, hingga logika di balik Database.

---

## 🚀 1. PITCHING PENGANTAR (ELEVATOR PITCH)

**Apa itu CaféPOS?**
CaféPOS adalah *sistem Point of Sale (POS)* modern berbasis web yang tidak hanya sekadar berfungsi sebagai kasir untuk memproses pembayaran, tetapi mendigitalisasi operasional *end-to-end* (keseluruhan alur) restoran. 

**Masalah Apa yang Diselesaikan?**
Aplikasi menutupi *bottleneck* dari pemesanan manual di mana pelayan harus bolak-balik mencatat kertas. Mulai dari pelanggan memesan makanan dari meja, pesanan tercetak secara logis di dapur, hingga kasir melakukan penagihan; semuanya difokuskan dan disinkronkan ke dalam satu alur *Real-Time*.

---

## 👥 2. FITUR & ALUR KERJA BERDASARKAN ROLE

Aplikasi menggunakan **Role-Based Access Control** (RBAC), membagi layar sesuai pekerjaan penggunanya:

1. **Pelanggan (Self-Service / QR Order):**
   * Pelanggan tidak perlu teriak memanggil pelayan. Mereka scan QR code / buka tautan unik meja, melihat katalog *(Menu Interaktif)*, memasukkan ke keranjang (*Cart via Zustand state*), dan melakukan checkout dari HP masing-masing.
2. **KDS - Kitchen Display System (Staf Dapur):**
   * Memiliki interface tampilan yang auto-menerima list pesanan baru. Dapur menekan tombol **"Cooking"** (Sedang Masak) dan **"Ready"** (Selesai). Status ini memudahkan pelayan tahu makanan mana yang siap dihidangkan.
3. **POS & Cashier (Kasir):**
   * Mengelola layar keranjang belanja manual *(Bila ada pelanggan memesan di meja kasir)*. Kasir menentukan diskon, pajak, nominal pembayaran (Tunai/Debit), hingga memicu *print* struk/nota.
4. **Admin (Pemilik Resto / Manajer):**
   * Mengatur operasi *back-office*. Melakukan *CRUD* daftar menu, melihat rekap stok bahan, manajemen meja, dan dapat melihat Grafik Laporan Pendapatan.

---

## 💻 3. TECH STACK (TEKNOLOGI YANG DIGUNAKAN)

Sistem menggunakan Arsitektur **Klien-Server (Decoupled)** di mana frontend dan backend dibangung benar-benar terpisah.

*   **Frontend Klien:** `React.js` (dengan `Vite` agar build cepat) + `Tailwind CSS`. Bersifat *Single Page Application* (Website yang responsif tanpa jeda *loading refresh/kedip* memuat halaman baru).
*   **State Management UI:** Menggunakan `Zustand`. Lebih direkomendasikan ketimbang Redux karena setup-nya jauh lebih ringan untuk mengontrol sesi Keranjang / Token Sesi (*Session*).
*   **Backend Server:** `Node.js` dengan framework `Express.js`. Node.js dipilih karena sifat programnya *Non-Blocking I/O*. Walaupun ratusan pelanggan melakukan klik checkout bersamaan, server tidak akan memblokir *request* yang masuk belakangan.
*   **Keamanan Terpadu:**
    *   Sesi API dilindungi dengan **JWT** (JSON Web Tokens). Admin butuh token ini untuk masuk ke rute-rute sensitif (seperti laporan uang). 
    *   Password seluruh staff disamarkan (Hashing) menggunakan **Bcrypt**.
*   **Database Master:** `MySQL` *(menggunakan XAMPP)* yang diakses dengan `Sequelize ORM` (Object-Relational Mapping). Mempersulit peretas untuk melakukan eksploitasi *SQL Injection*.

---

## 🗄️ 4. STRUKTUR & KONSEP LOGIKA DATABASE

Ini adalah bagian terpenting teknikal. Database CaféPOS menggunakan kaidah *Relasional Penuh* (RDBMS) dengan struktur entitas sebagai berikut:

**A. Skema Inventaris (Master)**
*   **`Category` -> `Product`:** Relasi *One to Many* (Satu Kategori, contoh: Kopi, memiliki banyak Produk (Americano, Latte)). Tabel product bertugas menyimpan harga (*price*) dan stok *live*.
*   **`StockIn`:** Bertugas sebagai Tabel Log/Riwayat rekam jejak rekrutmen bahan masuk (kapan, oleh siapa, berapa).

**B. Skema Transaksional (Jantung Proses)**
*   **`Order` (Nota/Invoice Utuh):** Dibuat saat pelanggan checkout. Ia mengikat data secara global: *Nomor Meja, Nomor Pesanan (ORD-2026..), Total Harga, Status Makanan, dan Info Pembayaran Lunas.*
*   **`OrderItem` (Rincian Produk Keranjang):** Relasinya *One-To-Many* dari Order. Jika seseorang datang dan membeli 3 kopi + 2 Kuenya, *Order* nya hanya 1 baris di tabel, tapi *OrderItem* nya terdiri dari 5 baris berbeda.

### 🌟 NILAI JUAL: Konsep Isolasi Histori pada `OrderItem`
*(Hafalkan dengan baik konsep rekayasa data ini karena akan menjadi poin teknikal luar biasa di mata dosen/penguji)*
> **Pertanyaannya:** "Bagaimana cara sistem Laporan Keuangan membukukan Transaksi jika sewaktu-waktu harga Makanan naik atau turun?"
> 
> **Jawaban:** "Agar keutuhan data masa lalu tidak rusak, saya menerapkan konsep metode **Historical Snapshot Data**. Ketika transaksi `Order` dibuat, di dalam tabel `OrderItem` saya *mem-fotokopi / snapshot* nama makanan (`productName`) dan harganya (`unitPrice`) pada detik tersebut. Sehingga di bulan depan, meskipun harga produk dasar *(Master Produk)* berubah, faktur pembukuan bulan lalu tetap membaca *harga lama* berdasarkan salinan konstan pada `OrderItem`-nya."

---

## ⚙️ 5. ALUR (LIFECYCLE) SATU SIKLUS PESANAN RESTORAN

Jelaskan 3 pilar aksi ini untuk menunjukkan alunan program:

**Tahap 1: Membentuk Pesanan (Init)**
*   Pengguna di Frontend klik *"Checkout"*. API dipanggil. Backend membaca *array keranjang* dan mengonversinya. Satu data induk dibuat di tabel `Order` dengan status `pending`, dan Rincian keranjang disebar masuk ke tabel `OrderItem`.

**Tahap 2: Operasional Dapur**
*   Layar dapur menangkap pesanan baru di List `pending`. Saat dapur mulai memasak mereka mengklik tombol, API menembak status menjadi `cooking`. Saat di klik kembali, status berubah mnejadi `ready` (siap saji ke meja).

**Tahap 3: Pelunasan & Pengurangan Stok Terotomasi**
*   Saat Kasir melakukan tagihan via Cash/Card di `POS Page`, API Pembayaran dijalankan. 
*   **Keunikan Skema Final:** Saat *Request Lunas* tersebut diproses di controller Node.js, Sistem akan otomatis melakukan perulangan array (`looping`), menghitung berapa produk yang dibeli pelanggan tadi, lalu melontarkan instruksi `UPDATE` ke tabel master produk untuk memotong porsi aktual (`stock = stock - terpakan`). Semua berjalan otomatis di *back-room*.

---

## 🎤 6. TIPS JAWABAN SANGGAHAN UMUM (Q & A TACTICS)

1. **Kenapa tidak pakai Redux?**
   > *Jawaban:* Redux terlalu kaku / banyak kode setup untuk aplikasi seukuran ini. State Management UI di level restoran cukup menggunakan Zustand karena API-nya bersih dan pemanggilan custom-hooksnya cukup ringan *(Minim Boilerplate)*.
2. **Kenapa dipisah antara Frontend dan Backend?**
   > *Jawaban:* Ini (*Decoupled API*) adalah standar industri. Tujuannya adalah "Skalabilitas". Kelak jika Café ini menjadi restoran waralaba, saya bisa men-deploy Backend Node.js ini ke cloud kuat, dan Frontendnya saja yang disalurkan ke HP/Tablet pengunjung, memastikan tidak ada crash percampuran aset antara render HTML dan proses logika hitung.
3. **Bagaimana fitur Struk Kasir (*Receipt*) dibuat?**
   > *Jawaban:* Saya merancang desain DOM UI *Modal* dengan dimensi tipis *(Thermal Print).* Fungsi cetaknya saya alihkan (*triggering*) melalui instrumen murni browser yaitu fungsi standar `window.print()` agar bisa dicetak dan di-preview oleh peripheral *Printer* eksternal milik komputer kasir.

---
_Bersemangatlah saat mendemokan aplikasi, dan selamat atas keberhasilan membangun sistem CaféPOS ini!_
