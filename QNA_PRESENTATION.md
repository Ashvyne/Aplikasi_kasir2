# 🎤 Daftar Pertanyaan & Jawaban Presentasi Project CaféPOS

Berikut adalah 20 perkiraan pertanyaan yang mungkin dilontarkan oleh penguji, rekruter, atau perusahaan saat Anda mempresentasikan **CaféPOS**, beserta rekomendasi jawabannya:

---

### 🌟 Konsep & Latar Belakang

**1. Bisa jelaskan secara singkat latar belakang dan masalah apa yang ingin diselesaikan dengan aplikasi CaféPOS ini?**
> **Jawaban:** Aplikasi ini dibuat untuk mendigitalisasi operasional café/restoran yang sebelumnya manual. Tujuannya adalah memfasilitasi pencatatan pesanan secara real-time, sinkronisasi otomatis dari pelanggan mandiri hingga kasir dan dapur (KDS), serta menyajikan laporan penjualan akurat tanpa harus hitung manual di akhir shift.

**2. Apa yang membuat aplikasi ini berbeda dengan aplikasi kasir (POS) standar lainnya?**
> **Jawaban:** CaféPOS tidak hanya berfokus pada kasir, tapi juga dipecah menjadi beberapa modul role-based. Kami menyediakan Kitchen Display System (KDS) untuk dapur, Manajemen Meja real-time, dan Portal Pemesanan Mandiri (QR-based) langsung untuk pelanggan dari meja mereka.

---

### 💻 Arsitektur & Teknologi

**3. Tech Stack apa saja yang kamu gunakan dalam pengembangan aplikasi ini dan mengapa memilihnya?**
> **Jawaban:** Frontend menggunakan **React.js & Tailwind CSS** agar UI interaktif dan responsif. Backend menggunakan **Node.js & Express.js** karena performa I/O non-blocking yang cepat untuk melayani banyak req REST API. Database menggunakan **MySQL (Sequelize ORM)** karena struktur data pesanan yang bersifat relasional. State management di React menggunakan **Zustand**.

**4. Mengapa memilih Zustand untuk state management dibanding Redux atau Context API bawaan?**
> **Jawaban:** Zustand jauh lebih ringan, minim *boilerplate* (setup kode) dibandingkan Redux, namun tetap jauh lebih mudah dikelola (memiliki struktur global state yang baik) dan di-debug jika dibandingkan dengan React Context API murni.

**5. Bagaimana arsitektur server aplikasi ini, apakah Monolithic atau Microservices?**
> **Jawaban:** Menggunakan arsitektur klien-server (*Decoupled*). Frontend dan backend dibuat secara terpisah (berbeda folder/repository base). Ini memudahkan kami jika nanti ingin melakukan scaling pada server Node.js-nya saja, atau men-deploy frontend secara *serverless* terpisah.

**6. Bagaimana kamu menangani keamanan API (*Security*) pada backend yang kamu buat?**
> **Jawaban:** Autentikasi menggunakan **JWT (JSON Web Tokens)** pada *header authorization*. Semua password user maupun staff disandikan (hashing) menggunakan **bcrypt**. Selain itu kami memiliki fungsi API middleware untuk memverifikasi Hak Akses (Role-Based Access Control), misalnya Kasir tidak bisa mengakses raw data analitik Admin.

**7. Untuk menyimpan foto menu dan logo toko, apakah disimpan ke database atau file system lokal/cloud?**
> **Jawaban:** Kami menggunakan modul **Multer** di Node.js untuk menghandle *file upload*. File gambar disimpan ke dalam *local file system* di dalam folder public/uploads di sisi backend, sementara database hanya menyimpan alamat text/URL dari foto tersebut agar lebih efisien dimuat.

---

### ⚙️ Logika & Fitur Utama

**8. Bagaimana sistem membedakan alur proses pesanan Dine-in (Makan di tempat) dan Take-away?**
> **Jawaban:** Pada tabel `Order`, kami menyediakan parameter `order_type`. Jika metode yang dipilih adalah **Dine-in**, maka sistem akan mewajibkan staf atau pelanggan untuk menginputkan relasi `table_id` supaya pesanan dapat diantarkan secara tepat.

**9. Bagaimana alur kerja fitur Kitchen Display System (KDS) dari pesanan masuk hingga selesai?**
> **Jawaban:** Saat kasir memasukkan pesanan / pelanggan melakukan self-checkout, API Order dibuat dan diteruskan ke halaman KDS di dapur. Staf dapur akan mem-validasi mulai dari status `Pending` -> diklik `Start Cooking` (berubah log Cooking) -> diklik `Complete` (Ready). Setiap *state* tercatat otomatis di Database di tabel *KitchenOrder*.

**10. Bagaimana struktur Database kalian untuk menyimpan riwayat Harga Item Pesanan agar jika harga makanan naik, laporan bulan lalu tidak berubah?**
> **Jawaban:** Kami memisahkan tabel Master `Product` dan tabel Transaksional `OrderItem`. Pada tabel `OrderItem`, saat pesanan dibuat *(checkout)* kami ikut menyimpan salinan porsi *`price`* nominal pada hari/detik tersebut. Sehingga perubahan harga produk asli di masa depan tidak mengubah data pada *OrderItem* masa lalu.

**11. Jika pesanan ternyata batal, bagaimana fitur aplikasi menangani pengurangan stok yang mungkin sudah terjadi?**
> **Jawaban:** Status pesanan diubah ke `Canceled`. Untuk menjamin data stok kembali seperti semula, maka aplikasi perlu menjalankan blok logika *restore stock*, dimana logika *Order Controller* mengembalikan total `quantity` dari *OrderItem* kembali ke kolom *stock* di tabel `Product`.

**12. Pada aplikasi ini tertera fitur Pelanggan Mandiri (Scan QR/URL), bagaimana sinkronisasi keranjangnya?**
> **Jawaban:** Pelanggan memiliki *local state trolley/cart* mereka sendiri dari local-storage browser masing-masing. Saat mereka checkout, datanya dikirim sebagai serangkaian Array Object `orderItems` ke backend untuk dijadikan Order baru yang kemudian akan langsung terlihat di monitor Kasir *(POS Page)*.

**13. Bagaimana cara fitur Hitung Stok otomatis berjalan tiap ada transaksi?**
> **Jawaban:** Kami menjalankannya setelah *Payment/Checkout* terkonfirmasi. Di dalam endpoint Transaksi, server melakukan iterasi pada setiap produk yang dibeli dan mengeksekusi query UPDATE `stock = stock - qty` ke table MySQL secara programatik.

**14. Bagaimana Anda membuat dan menampilkan Grafik Analitik di Dashboard Admin?**
> **Jawaban:** Data bersumber dari backend Controller *Analytics*, di mana database MySQL di-query menggunakan klausa Agregasi agregat khusus `SUM()`, `GROUP BY` tanggal penyelesaian pesanan. Respons JSON-nya kami olah di frontend menggunakan library **Recharts** untuk visualisasi cantik interaktif.

---

### 🔧 Operasional & Implementasi

**15. Apakah ada kesulitan saat mengerjakan pembagian halaman (*Routing*) bagi role yang berbeda-beda?**
> **Jawaban:** Ada tantangan saat mencegah pelanggan mangakses route kasir atau admin. Kami memecahkannya dengan membungkus halaman (Wrapping UI) di React dengan *Protected Route Components*, yang membaca token JWT localStorage. Jika token invalid/rolenya salah, otomatis dilempar (*redirect*) balik ke Halaman Login.

**16. Kasus Error apa (Bugs/Troubleshooting) yang paling menantang yang pernah diatasi dalam project ini?**
> **Jawaban:** *[Modifikasi sesuka hati, contoh]* Kesulitan terbesar ada saat merapikan sinkronisasi Data Binding antara POS *Page* (Penerima Pesanan), komponen Nota (*Receipt* Modal), dan perubahan Status Table. Mengatasinya harus memonitor *Zustand state logging* dan merapikan komponen *props passing* React. 

**17. Bagaimana Aplikasi Anda meng-handle Cetak Struk Kasir (*Receipt*)?**
> **Jawaban:** Struk nota dibentuk dengan DOM UI biasa namun disesuaikan ukuran font-nya mengikuti layout minimalis (lebar kasir thermal). Pada React, dibuat state modal dan kami memicu fungsi bawaan browser yaitu *`window.print()`* untuk mengirim form tersebut ke perangkat *printer* default komputer.

**18. Melihat ada dockerfile, bagaimana kalian merencanakan dan menjalankan proses *Deployment* untuk produksi ke live web?**
> **Jawaban:** Project kami sudah disiapkan menggunakan **Docker** (dengan *Docker Compose*). Kami membungkus frontend (melalui *Nginx Web Server*), backend (dengan node image), dan *database setup* ke *container* masing-masing agar porting ke server Ubuntu/VPS cloud stabil tanpa konflik *dependency*.

---

### 🔮 Orientasi Bisnis & Masa Depan

**19. Jika *traffic* cafe saat malam minggu/akhir pekan membeludak, apakah sistem (*backend*) ini sanggup secara *Scalability*?**
> **Jawaban:** Tentu saja. Express (Node.js) sangat unggul menghandle ribuan *request concurrent* ringan seperti pemesanan makanan. Apabila cafe bertumbuh memiliki cabang, arsitektur yang sudah di-Docker-kan ini akan mempermudah *horizontal scaling* atau *load balancing* jika diperlukan.

**20. Apa rencana perbaikan (*Future Development*) atau fitur yang mau ditambahkan di versi berikutnya?**
> **Jawaban:** 
> 1. Implementasi **WebSocket (Socket.IO)** agar notifikasi pesanan masuk ke Kasir dan KDS Dapur bekerja dengan kedip *real-time* 0-detik tanpa *refresh*.
> 2. Implementasi **Payment Gateway (Cth: Midtrans/Xendit)** agar pelanggan pemesan melalui QR mandiri bisa langsung membayar lunas lewat e-Wallet / Virtual Account dari gawai mereka sebelum dapur memasak.
