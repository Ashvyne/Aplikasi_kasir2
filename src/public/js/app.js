// ============ GLOBAL VARIABLES ============
// Menyimpan data produk dari API
let products = [];

// Menyimpan item yang ada di keranjang belanja
let cart = [];

// Menyimpan data transaksi dari API
let transactions = [];

// Flag untuk menandakan sedang loading data
let isLoading = false;

// Menyimpan referensi instance modal
let currentModalInstance = null;

// ============ DARK MODE MANAGEMENT ============

/**
 * Initialize dark mode from localStorage or system preference
 */
function initializeDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const savedTheme = localStorage.getItem('theme');
  
  // Tentukan theme berdasarkan preferensi tersimpan atau sistem
  let theme = savedTheme;
  if (!theme) {
    // Cek preferensi sistem
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
  
  // Terapkan theme
  applyTheme(theme);
  
  // Setup event listener untuk dark mode toggle button
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
  
  // Dengarkan perubahan preferensi sistem
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

/**
 * Terapkan theme ke dokumen
 * @param {string} theme - 'light' atau 'dark'
 */
function applyTheme(theme) {
  const darkModeToggle = document.getElementById('darkModeToggle');
  
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (darkModeToggle) {
      darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
      darkModeToggle.title = 'Toggle Light Mode';
    }
    console.log('🌙 Dark mode enabled');
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (darkModeToggle) {
      darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
      darkModeToggle.title = 'Toggle Dark Mode';
    }
    console.log('☀️ Light mode enabled');
  }
  
  // Simpan preferensi
  localStorage.setItem('theme', theme);
}

/**
 * Toggle dark mode on/off
 */
let isTogglingTheme = false;

function toggleDarkMode() {
  // Prevent rapid consecutive toggles
  if (isTogglingTheme) return;
  
  isTogglingTheme = true;
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  
  // Reset toggle flag after animation completes
  setTimeout(() => {
    isTogglingTheme = false;
  }, 100);
}

// ============ INITIALIZATION ============

// Event listener ketika halaman selesai dimuat
window.addEventListener('load', () => {
  console.log('📱 Loading app...');
  
  // Ambil token dari localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Jika token tidak ada, redirect ke halaman login
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    window.location.href = '/login';
    return;
  }
  
  // Tampilkan username di header
  if (user) {
    try {
      const userData = JSON.parse(user);
      document.getElementById('userDisplay').textContent = userData.username;
      console.log('✓ User loaded:', userData.username);
    } catch (e) {
      console.error('❌ Error parsing user:', e);
    }
  }
  
  // Inisialisasi aplikasi
  initializeApp();
});

// Function untuk menginisialisasi aplikasi
function initializeApp() {
  try {
    console.log('🔧 Initializing app...');
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Check server health
    console.log('🏥 Checking server health...');
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        console.log('✓ Server health:', data);
      })
      .catch(err => {
        console.warn('⚠️ Health check failed:', err.message);
      });
    
    // Update waktu saat ini
    updateTime();
    
    // Update waktu setiap 1 detik
    setInterval(updateTime, 1000);
    
    // Setup navigation menu
    setupNavigation();
    
    // Load semua data dengan error handling
    console.log('📦 Loading initial data...');
    Promise.all([
      loadProducts().catch(e => console.warn('⚠️ Products load failed:', e)),
      loadTransactions().catch(e => console.warn('⚠️ Transactions load failed:', e)),
      loadReports().catch(e => console.warn('⚠️ Reports load failed:', e))
    ]).then(() => {
      console.log('✓ All data loaded');
    }).catch(error => {
      console.error('❌ Data loading error:', error);
    });
    
    console.log('✓ App initialized successfully');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    console.error('Stack:', error.stack);
    showAlertModal('❌ Error!', 'Gagal menginisialisasi aplikasi. Refresh halaman.', 'danger');
  }
}

// ============ NAVIGATION ============

// Function untuk setup event listener navigation menu
function setupNavigation() {
  try {
    // Ambil semua menu item
    const navItems = document.querySelectorAll('.nav-item');
    console.log('📍 Found', navItems.length, 'nav items');
    
    // Add click event ke setiap menu item
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = item.getAttribute('data-page');
        console.log('🔗 Navigating to:', pageName);
        navigateTo(pageName);
      });
    });
    console.log('✓ Navigation setup complete');
  } catch (error) {
    console.error('❌ Navigation setup error:', error);
  }
}

// Function untuk navigasi ke halaman tertentu
function navigateTo(pageName) {
  try {
    console.log('📄 Navigate to:', pageName);
    
    // Sembunyikan semua halaman
    const allPages = document.querySelectorAll('.page');
    console.log('📄 Found', allPages.length, 'pages');
    allPages.forEach(page => {
      page.classList.remove('active');
    });
    
    // Tampilkan halaman yang dipilih
    const page = document.getElementById(`${pageName}-page`);
    if (!page) {
      throw new Error(`Page not found: ${pageName}-page`);
    }
    page.classList.add('active');
    console.log('✓ Page shown:', pageName);
    
    // Update class active di navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
      console.log('✓ Nav updated');
    }
    
    // Update title halaman di header
    const titles = {
      pos: 'Penjualan',
      products: 'Daftar Produk',
      transactions: 'Riwayat Penjualan',
      reports: 'Laporan & Analitik'
    };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      pageTitle.textContent = titles[pageName] || 'Page';
    }
    
    // Reload data jika diperlukan
    if (pageName === 'products') {
      console.log('🔄 Reloading products...');
      loadProducts();
    }
    if (pageName === 'transactions') {
      console.log('🔄 Reloading transactions...');
      loadTransactions();
    }
    if (pageName === 'reports') {
      console.log('🔄 Reloading reports...');
      loadReports();
    }
    
    console.log('✓ Navigation complete');
  } catch (error) {
    console.error('❌ Navigation error:', error);
  }
}

// Function untuk update waktu saat ini di header
function updateTime() {
  try {
    const now = new Date();
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const timeEl = document.getElementById('currentTime');
    if (timeEl) {
      timeEl.textContent = now.toLocaleDateString('id-ID', options);
    }
  } catch (error) {
    console.error('❌ Time update error:', error);
  }
}

// ============ PRODUCTS ============

// Function untuk load semua produk dari API
async function loadProducts() {
  try {
    console.log('📦 Loading products...');
    isLoading = true;
    
    // Ambil token dari localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found');
    }
    
    console.log('📡 Fetching from /api/products');
    // Kirim request GET ke API products
    const response = await fetch('/api/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    
    // Cek apakah response OK
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse JSON response
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    // Assign data ke variable products
    products = Array.isArray(data.products) ? data.products : (data.data || []);
    
    console.log('✓ Loaded', products.length, 'products');
    // Tampilkan produk di grid
    displayProducts();
    // Tampilkan produk di table
    loadProductsTable();
    isLoading = false;
  } catch (error) {
    console.error('❌ Error loading products:', error);
    isLoading = false;
    
    // Gunakan demo data jika API error
    console.log('⚠️ Using demo products');
    products = [
      { id: 1, name: 'Nasi Goreng', sku: 'NG001', category: '1', price: 25000, stock: 15 },
      { id: 2, name: 'Mie Ayam', sku: 'MA001', category: '1', price: 20000, stock: 10 },
      { id: 3, name: 'Es Teh Manis', sku: 'ETM001', category: '2', price: 5000, stock: 50 },
      { id: 4, name: 'Soto Ayam', sku: 'SA001', category: '1', price: 15000, stock: 8 },
      { id: 5, name: 'Lumpia Goreng', sku: 'LG001', category: '3', price: 12000, stock: 20 }
    ];
    displayProducts();
    loadProductsTable();
  }
}

// Function untuk menampilkan produk di grid (halaman POS)
function displayProducts() {
  try {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
      console.error('❌ productsGrid element not found');
      return;
    }
    
    // Clear grid terlebih dahulu
    grid.innerHTML = '';
    console.log('🎨 Displaying', products.length, 'products');
    
    // Jika tidak ada produk, tampilkan pesan
    if (products.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted);">Tidak ada produk</p>';
      return;
    }
    
    // Loop setiap produk dan buat card
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = `product-card ${product.stock === 0 ? 'unavailable' : ''}`;
      
      // Tentukan status stok
      const stockStatus = product.stock === 0 ? 'empty' : product.stock < 10 ? 'low' : 'ok';
      
      // Map kategori ke emoji dan warna
      const categoryMap = {
        '1': { emoji: '🍜', name: 'Makanan' },
        '2': { emoji: '🥤', name: 'Minuman' },
        '3': { emoji: '🍿', name: 'Snack' },
        '4': { emoji: '📱', name: 'Elektronik' },
        '5': { emoji: '📦', name: 'Lainnya' }
      };
      const category = categoryMap[product.category] || { emoji: '📦', name: 'Produk' };
      
      // Buat HTML untuk card dengan gambar
      card.innerHTML = `
        <div class="product-card-image">
          ${product.image_url ? 
            `<img src="${product.image_url}" alt="${escapeHtml(product.name)}" class="product-card-img">` :
            `<div class="product-card-image-placeholder">${category.emoji}</div>`
          }
        </div>
        <div class="product-card-header">
          ${product.stock < 5 && product.stock > 0 ? '<span class="product-card-badge">⚠️ Terbatas</span>' : ''}
          ${product.stock === 0 ? '<span class="product-card-badge" style="background: #ef4444;">Habis</span>' : ''}
          <h4 class="product-card-name">${escapeHtml(product.name)}</h4>
        </div>
        <div class="product-card-content">
          <div>
            <div class="product-card-price">Rp ${formatPrice(product.price)}</div>
            <div class="product-card-stock ${stockStatus}">
              <span class="product-card-stock-indicator"></span>
              <span>${product.stock} stok</span>
            </div>
          </div>
        </div>
        <div class="product-card-footer">
          <button class="product-card-btn" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
            Tambah ke Keranjang
          </button>
        </div>
      `;
      
      // Tambahkan card ke grid
      grid.appendChild(card);
    });
    console.log('✓ Products displayed');
  } catch (error) {
    console.error('❌ Display products error:', error);
  }
}

// Function untuk menampilkan produk di table (halaman Products)
function loadProductsTable() {
  try {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) {
      console.error('❌ productsTableBody element not found');
      return;
    }
    
    // Clear table terlebih dahulu
    tbody.innerHTML = '';
    console.log('📋 Loading products table with', products.length, 'items');
    
    // Jika tidak ada produk, tampilkan pesan
    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Tidak ada produk</td></tr>';
      return;
    }
    
    // Loop setiap produk dan buat row table
    products.forEach((product, index) => {
      const row = tbody.insertRow();
      // Tentukan status badge stok
      const stockStatus = product.stock === 0 ? 'danger' : product.stock < 10 ? 'warning' : 'success';
      
      // Buat HTML untuk row table
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(product.name)}</strong></td>
        <td><span class="badge badge-info">${escapeHtml(product.sku)}</span></td>
        <td>${getCategoryName(product.category)}</td>
        <td>Rp ${formatPrice(product.price)}</td>
        <td><span class="badge badge-${stockStatus}">${product.stock} unit</span></td>
        <td>
          <div class="table-actions">
            <button class="table-btn table-btn-primary" onclick="editProduct(${product.id})">✏️ Edit</button>
            <button class="table-btn table-btn-danger" onclick="deleteProduct(${product.id})">🗑️ Hapus</button>
          </div>
        </td>
      `;
    });
    console.log('✓ Products table loaded');
  } catch (error) {
    console.error('❌ Load products table error:', error);
  }
}

// Function untuk membuka modal form produk (tambah/edit)
function openProductModal(productId = null) {
  try {
    console.log('🔓 Opening product modal, productId:', productId);
    
    // Sembunyikan modal lain yang sedang terbuka
    const existingModals = document.querySelectorAll('.modal.show');
    existingModals.forEach(modal => {
      const instance = bootstrap.Modal.getInstance(modal);
      if (instance) {
        instance.hide();
      }
    });
    
    // Ambil element-element yang dibutuhkan
    const modalElement = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    const idInput = document.getElementById('productId');
    const submitBtn = document.getElementById('submitBtn');
    const alertContainer = document.getElementById('alertContainer');
    
    if (!modalElement) {
      console.error('❌ Modal element not found!');
      return;
    }
    
    // Clear alert
    alertContainer.innerHTML = '';
    
    // Reset form dan image preview
    if (form) {
      form.reset();
    }
    
    // Reset image preview
    const fileInput = document.getElementById('productImage');
    if (fileInput) {
      fileInput.value = '';
      const imagePreviewDiv = document.getElementById('imagePreview');
      const previewDisplay = document.getElementById('imagePreviewDisplay');
      const previewContainer = document.getElementById('imagePreviewContainer');
      
      if (imagePreviewDiv && previewDisplay) {
        imagePreviewDiv.style.display = 'block';
        previewDisplay.style.display = 'none';
        previewContainer.classList.remove('border-success');
        previewContainer.classList.add('border-dashed');
      }
    }
    
    // Mode Edit atau Tambah
    if (productId) {
      // Mode Edit - ubah title dan button
      title.innerHTML = '<i class="bi bi-pencil-square"></i> Edit Produk';
      submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Simpan Perubahan';
      
      // Cari produk berdasarkan ID
      const product = products.find(p => p.id === productId);
      console.log('📝 Found product:', product);
      
      // Isi form dengan data produk
      if (product) {
        idInput.value = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productCategory').value = product.category || '1';
        document.getElementById('productPrice').value = product.price || 0;
        document.getElementById('productStock').value = product.stock || 0;
        
        // Tampilkan preview gambar jika ada
        if (product.image_url) {
          const previewImg = document.getElementById('previewImg');
          const imagePreviewDiv = document.getElementById('imagePreview');
          const previewDisplay = document.getElementById('imagePreviewDisplay');
          const previewContainer = document.getElementById('imagePreviewContainer');
          
          if (previewImg && imagePreviewDiv && previewDisplay) {
            previewImg.src = product.image_url;
            imagePreviewDiv.style.display = 'none';
            previewDisplay.style.display = 'block';
            previewContainer.classList.add('border-success');
            previewContainer.classList.remove('border-dashed');
          }
        }
      }
    } else {
      // Mode Tambah - reset title dan button
      title.innerHTML = '<i class="bi bi-plus-circle"></i> Tambah Produk Baru';
      submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Simpan Produk';
      idInput.value = '';
    }
    
    // Tutup instance modal sebelumnya jika ada
    if (currentModalInstance) {
      currentModalInstance.hide();
    }
    
    // Buat instance modal baru dengan Bootstrap 5
    currentModalInstance = new bootstrap.Modal(modalElement, {
      keyboard: true,
      backdrop: 'static',
      focus: true
    });
    
    // Event listener ketika modal ditampilkan
    modalElement.addEventListener('shown.bs.modal', () => {
      console.log('✓ Modal shown');
      // Auto focus ke input pertama
      document.getElementById('productName').focus();
    });
    
    // Event listener ketika modal ditutup
    modalElement.addEventListener('hidden.bs.modal', () => {
      console.log('✓ Modal hidden');
      currentModalInstance = null;
    });
    
    // Tampilkan modal
    currentModalInstance.show();
    
    console.log('✓ Modal opened successfully');
  } catch (error) {
    console.error('❌ Open modal error:', error);
    alert('Error membuka modal: ' + error.message);
  }
}

// Function untuk menutup modal produk
function closeProductModal() {
  try {
    console.log('🔒 Closing product modal');
    
    // Hide modal jika ada instance yang terbuka
    if (currentModalInstance) {
      currentModalInstance.hide();
      currentModalInstance = null;
    }
    
    console.log('✓ Modal closed');
  } catch (error) {
    console.error('❌ Close modal error:', error);
  }
}

// Function untuk menampilkan alert di dalam modal
function showAlert(type, title, message) {
  try {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    // Buat HTML untuk alert
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
        <strong>${escapeHtml(title)}:</strong> ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    alertContainer.innerHTML = alertHtml;
    
    console.log('✓ Alert shown:', type, title);
  } catch (error) {
    console.error('❌ Show alert error:', error);
  }
}

// Function untuk preview gambar produk
function previewImage(event) {
  const file = event.target.files[0];
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewDisplay = document.getElementById('imagePreviewDisplay');
  const previewImg = document.getElementById('previewImg');
  const imagePreviewDiv = document.getElementById('imagePreview');
  
  if (file) {
    // Validasi file size
    if (file.size > 5 * 1024 * 1024) {
      showAlert('warning', 'Peringatan', 'Ukuran file terlalu besar, maksimal 5MB');
      event.target.value = '';
      return;
    }
    
    // Validasi file type
    if (!file.type.startsWith('image/')) {
      showAlert('warning', 'Peringatan', 'File harus berupa gambar');
      event.target.value = '';
      return;
    }
    
    // Buat preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imagePreviewDiv.style.display = 'none';
      previewDisplay.style.display = 'block';
      previewContainer.classList.add('border-success');
      previewContainer.classList.remove('border-dashed');
      console.log('✓ Image preview loaded');
    };
    reader.readAsDataURL(file);
  }
}

// Function untuk clear image preview
function clearImagePreview() {
  const fileInput = document.getElementById('productImage');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewDisplay = document.getElementById('imagePreviewDisplay');
  const imagePreviewDiv = document.getElementById('imagePreview');
  
  fileInput.value = '';
  imagePreviewDiv.style.display = 'block';
  previewDisplay.style.display = 'none';
  previewContainer.classList.remove('border-success');
  previewContainer.classList.add('border-dashed');
  console.log('✓ Image preview cleared');
}

// Drag & drop handling untuk upload gambar
document.addEventListener('DOMContentLoaded', () => {
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const productImageInput = document.getElementById('productImage');
  
  if (imagePreviewContainer && productImageInput) {
    // Click to upload
    imagePreviewContainer.addEventListener('click', () => {
      productImageInput.click();
    });
    
    // Drag over
    imagePreviewContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      imagePreviewContainer.style.borderColor = '#0d6efd';
      imagePreviewContainer.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
    });
    
    // Drag leave
    imagePreviewContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      imagePreviewContainer.style.borderColor = '#dee2e6';
      imagePreviewContainer.style.backgroundColor = 'transparent';
    });
    
    // Drop
    imagePreviewContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      imagePreviewContainer.style.borderColor = '#dee2e6';
      imagePreviewContainer.style.backgroundColor = 'transparent';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        productImageInput.files = files;
        const event = new Event('change', { bubbles: true });
        productImageInput.dispatchEvent(event);
      }
    });
  }
});

// Function untuk save/edit produk
async function saveProduct(event) {
  event.preventDefault();
  
  try {
    console.log('💾 Saving product...');
    
    // Ambil nilai dari form
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value.trim();
    const productSku = document.getElementById('productSku').value.trim();
    const productCategory = document.getElementById('productCategory').value;
    const productPrice = parseInt(document.getElementById('productPrice').value) || 0;
    const productStock = parseInt(document.getElementById('productStock').value) || 0;
    const productImageFile = document.getElementById('productImage').files[0];
    
    // Validasi input
    if (!productName) {
      showAlert('danger', 'Error', 'Nama produk harus diisi');
      return;
    }
    if (!productSku) {
      showAlert('danger', 'Error', 'SKU harus diisi');
      return;
    }
    if (productPrice <= 0) {
      showAlert('danger', 'Error', 'Harga harus lebih dari 0');
      return;
    }
    if (productStock < 0) {
      showAlert('danger', 'Error', 'Stok tidak boleh negatif');
      return;
    }
    
    // Ambil token
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('danger', 'Error', 'Token expired, login kembali');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    // Gunakan FormData untuk handle file upload
    const formData = new FormData();
    formData.append('name', productName);
    formData.append('sku', productSku);
    formData.append('category', productCategory);
    formData.append('price', productPrice);
    formData.append('stock', productStock);
    
    // Append image jika ada file
    if (productImageFile) {
      formData.append('image', productImageFile);
    }
    
    // Tentukan URL dan method berdasarkan mode
    const url = productId ? `/api/products/${productId}` : '/api/products';
    const method = productId ? 'PUT' : 'POST';
    
    console.log(`📡 ${method} ${url}`);
    console.log('Sending FormData with image...');
    
    // Kirim request ke API
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`
        // Jangan set Content-Type, browser akan set secara otomatis dengan boundary
      },
      body: formData
    });

    console.log('📊 Response status:', response.status);
    
    // Jika response OK
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Product saved:', data);
      
      // Tentukan pesan sukses
      let successMessage = 'Produk berhasil ditambahkan';
      if (productId) {
        successMessage = 'Produk berhasil diperbarui';
      }
      
      showAlert('success', 'Berhasil', successMessage);
      
      // Tutup modal dan reload data
      setTimeout(() => {
        closeProductModal();
        loadProducts();
      }, 1500);
    } else {
      // Handle error response
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('❌ API Error:', response.status, errorData);
      showAlert('danger', 'Error', errorData.message || 'Gagal menyimpan produk');
    }
  } catch (error) {
    console.error('❌ Save product error:', error);
    showAlert('danger', 'Error', 'Terjadi kesalahan: ' + error.message);
  }
}

// Function untuk edit produk
async function editProduct(productId) {
  openProductModal(productId);
}

// Function untuk delete produk
async function deleteProduct(productId) {
  // Gunakan SweetAlert2 untuk konfirmasi delete
  Swal.fire({
    title: 'Hapus Produk?',
    text: 'Produk yang dihapus tidak dapat dikembalikan',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        // Kirim DELETE request ke API
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Jika sukses
        if (response.ok) {
          // Hapus dari array products
          products = products.filter(p => p.id !== productId);
          showAlertModal('Berhasil!', 'Produk berhasil dihapus', 'success');
          // Reload halaman produk
          loadProducts();
        } else {
          showAlertModal('Gagal!', 'Gagal menghapus produk', 'danger');
        }
      } catch (error) {
        console.error('❌ Delete error:', error);
        showAlertModal('Error!', 'Terjadi kesalahan', 'danger');
      }
    }
  });
}

// ============ CART ============

// Function untuk menambah item ke keranjang
function addToCart(productId) {
  try {
    // Cari produk berdasarkan ID
    const product = products.find(p => p.id === productId);
    if (!product) {
      // Gunakan SweetAlert2 untuk error
      showAlertModal('Gagal!', 'Produk tidak ditemukan', 'danger');
      return;
    }
    
    // Cek apakah produk sudah ada di keranjang
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      // Jika ada, naikkan quantity
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
      } else {
        // Gunakan SweetAlert2 untuk warning
        showAlertModal('Peringatan!', 'Stok tidak cukup', 'warning');
        return;
      }
    } else {
      // Jika belum ada, tambahkan item baru
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }
    
    // Update tampilan keranjang
    displayCart();
    updateTotal();
    console.log('✓ Item added to cart');
  } catch (error) {
    console.error('❌ Add to cart error:', error);
  }
}

// Function untuk menghapus item dari keranjang
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  displayCart();
  updateTotal();
}

// Function untuk update quantity item di keranjang
function updateCartQuantity(productId, quantity) {
  try {
    // Cari item di keranjang
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item) {
      // Jika quantity 0 atau kurang, hapus item
      if (quantity <= 0) {
        removeFromCart(productId);
      } else if (quantity <= product.stock) {
        // Update quantity jika valid
        item.quantity = quantity;
        displayCart();
        updateTotal();
      } else {
        // Jika melebihi stok, tampilkan alert
        alert('⚠️ Stok tidak cukup');
      }
    }
  } catch (error) {
    console.error('❌ Update quantity error:', error);
  }
}

// Function untuk menampilkan item-item di keranjang
function displayCart() {
  try {
    const cartDiv = document.getElementById('cartItems');
    cartDiv.innerHTML = '';
    
    // Jika keranjang kosong
    if (cart.length === 0) {
      cartDiv.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">Keranjang kosong</p>';
      return;
    }
    
    // Loop setiap item di keranjang
    cart.forEach(item => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-detail">Rp ${formatPrice(item.price)} x ${item.quantity}</div>
        </div>
        <div class="cart-item-qty">
          <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
      `;
      cartDiv.appendChild(cartItem);
    });
  } catch (error) {
    console.error('❌ Display cart error:', error);
  }
}

// Function untuk update total belanja
function updateTotal() {
  try {
    // Ambil nilai diskon
    const discount = parseInt(document.getElementById('discount').value) || 0;
    let subtotal = 0;
    
    // Hitung subtotal
    cart.forEach(item => {
      subtotal += item.price * item.quantity;
    });
    
    // Hitung total (subtotal - diskon)
    const total = Math.max(0, subtotal - discount);
    
    // Update elemen DOM
    document.getElementById('subtotal').textContent = 'Rp ' + formatPrice(subtotal);
    document.getElementById('total').textContent = 'Rp ' + formatPrice(total);
  } catch (error) {
    console.error('❌ Update total error:', error);
  }
}

// Function untuk hitung kembalian
function calculateChange() {
  try {
    // Ambil total dan uang yang diterima
    const total = getTotalAmount();
    const received = parseInt(document.getElementById('cashReceived').value) || 0;
    // Hitung kembalian
    const change = Math.max(0, received - total);
    
    // Update elemen DOM
    document.getElementById('changeAmount').textContent = 'Rp ' + formatPrice(change);
  } catch (error) {
    console.error('❌ Calculate change error:', error);
  }
}

// Function untuk ambil total amount
function getTotalAmount() {
  const discount = parseInt(document.getElementById('discount').value) || 0;
  let subtotal = 0;
  
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  return Math.max(0, subtotal - discount);
}

// Function untuk clear/batal transaksi
function clearCart() {
  // Gunakan SweetAlert2 untuk konfirmasi
  Swal.fire({
    title: 'Batalkan Transaksi?',
    text: 'Semua item di keranjang akan dihapus',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Batalkan',
    cancelButtonText: 'Tidak'
  }).then((result) => {
    if (result.isConfirmed) {
      cart = [];
      displayCart();
      updateTotal();
      document.getElementById('discount').value = 0;
      document.getElementById('cashReceived').value = '';
      document.getElementById('changeAmount').textContent = 'Rp 0';
      console.log('✓ Cart cleared');
    }
  });
}

// Function untuk checkout/selesaikan transaksi
async function checkoutTransaction() {
  try {
    // Cek apakah keranjang ada isi
    if (cart.length === 0) {
      showAlertModal('Gagal!', 'Keranjang masih kosong', 'danger');
      return;
    }
    
    // Ambil data transaksi
    const paymentMethod = document.getElementById('paymentMethod').value;
    const total = getTotalAmount();
    const received = parseInt(document.getElementById('cashReceived').value) || 0;
    
    // Validasi untuk pembayaran tunai
    if (paymentMethod === 'Tunai' && received < total) {
      showAlertModal('Gagal!', 'Uang diterima tidak cukup', 'danger');
      return;
    }
    
    // Buat object transaksi
    const transactionData = {
      items: cart,
      total: total,
      paymentMethod: paymentMethod,
      discount: parseInt(document.getElementById('discount').value) || 0
    };
    
    console.log('📝 Transaction Data:', JSON.stringify(transactionData, null, 2));
    
    // Tampilkan loading
    Swal.fire({
      title: 'Memproses Transaksi',
      html: '<p>Sedang menyimpan transaksi...</p>',
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Kirim transaksi ke API
    const token = localStorage.getItem('token');
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transactionData)
    });
    
    console.log('📊 Transaction Response Status:', response.status);
    const responseData = await response.json();
    console.log('📊 Response Data:', responseData);
    
    // Jika transaksi berhasil disimpan
    if (response.ok && responseData.success) {
      const data = responseData;
      
      console.log('✓ Transaction saved successfully');
      console.log('📦 Invoice Number:', data.invoiceNumber);
      
      // Array untuk track stock reduction results
      let stockReduceResults = [];
      let allStockReduced = true;
      
      // Kurangi stok untuk setiap item di keranjang
      for (const item of cart) {
        try {
          console.log(`📦 Reducing stock for product ID ${item.id} (${item.name})...`);
          
          const stockResponse = await fetch(`/api/products/${item.id}/reduce-stock`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: item.quantity })
          });
          
          const stockData = await stockResponse.json();
          console.log('   Response:', stockData);
          
          if (stockResponse.ok && stockData.success) {
            console.log(`✓ Stock reduced: ${item.name}`);
            stockReduceResults.push({
              productId: item.id,
              productName: item.name,
              success: true,
              oldStock: stockData.product.oldStock,
              newStock: stockData.product.newStock
            });
          } else {
            console.warn(`⚠️ Stock reduction failed for ${item.name}`);
            stockReduceResults.push({
              productId: item.id,
              productName: item.name,
              success: false,
              error: stockData.message
            });
            allStockReduced = false;
          }
        } catch (error) {
          console.error(`❌ Error reducing stock for product ${item.id}:`, error);
          stockReduceResults.push({
            productId: item.id,
            productName: item.name,
            success: false,
            error: error.message
          });
          allStockReduced = false;
        }
      }
      
      let stockMessage = allStockReduced ? 'Semua stok berhasil diperbarui ✓' : '⚠️ Beberapa item gagal update stok';
      
      // Tampilkan success alert
      Swal.fire({
        title: 'Transaksi Berhasil! 🎉',
        html: `
          <div style="text-align: left;">
            <div style="margin-bottom: 12px;">
              <strong>No. Invoice:</strong> ${data.invoiceNumber}<br>
              <strong>Total:</strong> Rp ${formatPrice(total)}<br>
              <strong>Stok:</strong> ${stockMessage}
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#28a745',
        confirmButtonText: '✓ OK',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        // Clear keranjang
        cart = [];
        displayCart();
        updateTotal();
        document.getElementById('discount').value = 0;
        document.getElementById('cashReceived').value = '';
        document.getElementById('changeAmount').textContent = 'Rp 0';
        
        // Reload semua data
        loadProducts();
        loadTransactions();
        loadReports();
      });
    } else {
      // Transaksi gagal
      const errorMsg = responseData.message || 'Gagal memproses transaksi';
      console.error('❌ Transaction failed:', errorMsg);
      showAlertModal('Gagal!', errorMsg, 'danger');
    }
  } catch (error) {
    console.error('❌ Checkout error:', error);
    console.error('   Stack:', error.stack);
    showAlertModal('Error!', 'Terjadi kesalahan: ' + error.message, 'danger');
  }
}

// ============ TRANSACTIONS ============

// Function untuk load semua transaksi dari API
async function loadTransactions() {
  try {
    console.log('📋 Loading transactions...');
    const response = await fetch('/api/transactions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Jika berhasil
    if (response.ok) {
      const data = await response.json();
      
      // Extract transactions array from various response formats
      let txList = [];
      if (Array.isArray(data)) {
        txList = data;
      } else if (Array.isArray(data.transactions)) {
        txList = data.transactions;
      } else if (Array.isArray(data.data)) {
        txList = data.data;
      } else {
        txList = [];
      }
      
      // Ensure each transaction has items as array
      transactions = txList.map(tx => ({
        ...tx,
        items: Array.isArray(tx.items) ? tx.items : (typeof tx.items === 'string' ? tryParseJSON(tx.items, []) : [])
      }));
      
      console.log(`✓ Loaded ${transactions.length} transactions`);
      displayTransactions();
    } else {
      console.error('❌ Failed to load transactions:', response.statusText);
    }
  } catch (error) {
    console.error('⚠️ Error loading transactions:', error);
  }
}

// Helper function to safely parse JSON
function tryParseJSON(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('⚠️ Failed to parse JSON:', e);
    return defaultValue;
  }
}

// Function untuk menampilkan transaksi di table
function displayTransactions() {
  try {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';
    
    // Jika tidak ada transaksi
    if (transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Tidak ada transaksi</td></tr>';
      return;
    }
    
    // Loop setiap transaksi
    transactions.forEach(trans => {
      const row = tbody.insertRow();
      
      // Support both createdAt dan created_at
      const dateStr = trans.createdAt || trans.created_at || new Date().toISOString();
      const date = new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Support both camelCase dan snake_case field names
      const invoiceNumber = trans.invoiceNumber || trans.invoice_number || 'N/A';
      const paymentMethod = trans.paymentMethod || trans.payment_method || 'Tunai';
      const total = trans.total || 0;
      const itemsCount = Array.isArray(trans.items) ? trans.items.length : 0;
      
      // Buat HTML row
      row.innerHTML = `
        <td><strong>${escapeHtml(invoiceNumber)}</strong></td>
        <td>${date}</td>
        <td><span class="badge bg-info">${itemsCount} item</span></td>
        <td><strong>Rp ${formatPrice(total)}</strong></td>
        <td><span class="badge bg-success">${escapeHtml(paymentMethod)}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewTransaction(${trans.id})">👁️ Lihat</button>
        </td>
      `;
    });
  } catch (error) {
    console.error('❌ Display transactions error:', error);
  }
}

// Function untuk view detail transaksi menggunakan SweetAlert2
function viewTransaction(transactionId) {
  try {
    // Cari transaksi berdasarkan ID
    const trans = transactions.find(t => t.id === transactionId);
    
    if (trans) {
      // Format tanggal transaksi
      const dateObj = new Date(trans.createdAt || trans.created_at);
      const date = dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Parse items dari trans.items
      let items = trans.items || [];
      
      // Jika items berupa string JSON, parse terlebih dahulu
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          console.warn('⚠️ Failed to parse items:', e);
          items = [];
        }
      }
      
      // Validasi items adalah array
      if (!Array.isArray(items)) {
        items = [];
      }
      
      // Buat daftar items
      let itemsList = '<div style="text-align: left; margin-top: 15px;">';
      if (items && items.length > 0) {
        items.forEach((item, index) => {
          // Support both price/harga field names
          const itemPrice = parseInt(item.price || item.harga) || 0;
          const itemQty = parseInt(item.quantity || item.qty) || 1;
          const itemTotal = itemPrice * itemQty;
          
          itemsList += `
            <div class="transaction-item" style="padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <strong style="display: block; margin-bottom: 4px;">${index + 1}. ${escapeHtml(item.name || 'Unknown')}</strong>
                <small style="color: #666; display: block;">Qty: ${itemQty} × Rp ${formatPrice(itemPrice)}</small>
              </div>
              <div style="text-align: right; margin-left: 10px; white-space: nowrap;">
                <strong>Rp ${formatPrice(itemTotal)}</strong>
              </div>
            </div>
          `;
        });
      } else {
        itemsList += '<div style="padding: 10px 0;"><em style="color: #999;">Tidak ada item</em></div>';
      }
      itemsList += '</div>';
      
      // Hitung subtotal dari items
      let subtotal = 0;
      if (items && items.length > 0) {
        items.forEach(item => {
          const price = parseInt(item.price || item.harga) || 0;
          const qty = parseInt(item.quantity || item.qty) || 1;
          subtotal += price * qty;
        });
      }
      
      // Ambil data transaksi - support both camelCase dan snake_case
      const total = parseInt(trans.total) || 0;
      const discount = parseInt(trans.discount || trans.diskon || 0) || 0;
      const invoiceNumber = trans.invoiceNumber || trans.invoice_number || 'N/A';
      const paymentMethod = trans.paymentMethod || trans.payment_method || 'Tunai';
      
      // Tampilkan SweetAlert2 dengan detail transaksi
      Swal.fire({
        title: '📋 Detail Transaksi',
        html: `
          <div class="transaction-detail" style="text-align: left;">
            <div class="transaction-info" style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
              <div style="margin-bottom: 8px;">
                <strong>No. Invoice:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${escapeHtml(invoiceNumber)}</code>
              </div>
              <div style="margin-bottom: 8px;">
                <strong>Tanggal:</strong> <span style="color: inherit;">${date}</span>
              </div>
              <div>
                <strong>Metode Pembayaran:</strong> <span class="badge bg-success" style="background-color: #198754 !important; color: white;">${escapeHtml(paymentMethod)}</span>
              </div>
            </div>
            
            <hr style="margin: 15px 0; border-color: #e9ecef;">
            
            <strong class="items-title" style="display: block; margin-bottom: 10px;">Item (${items.length} item):</strong>
            ${itemsList}
            
            <hr style="margin: 15px 0; border-color: #e9ecef;">
            
            <div class="transaction-calculation">
              <div class="calc-row" style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                <span>Subtotal:</span>
                <span>Rp ${formatPrice(subtotal)}</span>
              </div>
              ${discount > 0 ? `
              <div class="calc-row discount" style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                <span>Diskon:</span>
                <span style="color: #dc3545;">-Rp ${formatPrice(discount)}</span>
              </div>
              ` : ''}
              <div class="calc-row total" style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; padding: 12px; background-color: #f0f8ff; border-radius: 6px; border: 1px solid #cfe2ff; color: #0066cc;">
                <span style="color: inherit;">Total Bayar:</span>
                <span style="color: inherit;">Rp ${formatPrice(total)}</span>
              </div>
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonColor: '#0d6efd',
        confirmButtonText: '✓ Tutup',
        width: '500px'
      });
      
      console.log('✓ Transaction detail shown:', invoiceNumber);
    } else {
      Swal.fire({
        title: 'Gagal!',
        text: 'Transaksi tidak ditemukan',
        icon: 'error',
        confirmButtonColor: '#0d6efd'
      });
    }
  } catch (error) {
    console.error('❌ View transaction error:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Terjadi kesalahan: ' + error.message,
      icon: 'error',
      confirmButtonColor: '#0d6efd'
    });
  }
}

// Function untuk export transaksi ke Excel menggunakan SweetAlert2
async function exportSalesExcel() {
  try {
    console.log('📊 Starting sales export...');
    
    // Show loading
    Swal.fire({
      title: 'Memproses Export',
      html: '<p>Sedang membuat file Excel...</p>',
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const token = localStorage.getItem('token');
    
    // Fetch export data
    const response = await fetch('/api/export/sales-excel', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export gagal');
    }

    // Create blob dari response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Penjualan_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✓ Export completed successfully');
    
    Swal.fire({
      title: 'Berhasil! ✓',
      text: 'File telah didownload',
      icon: 'success',
      confirmButtonColor: '#28a745',
      confirmButtonText: '✓ OK'
    });
  } catch (error) {
    console.error('❌ Export error:', error);
    Swal.fire({
      title: 'Gagal!',
      text: 'Terjadi kesalahan saat export: ' + error.message,
      icon: 'error',
      confirmButtonColor: '#dc3545',
      confirmButtonText: '✓ OK'
    });
  }
}

// Function untuk export produk ke Excel
async function exportProductsExcel() {
  try {
    console.log('📊 Starting products export...');
    
    // Show loading
    Swal.fire({
      title: 'Memproses Export',
      html: '<p>Sedang membuat file Excel...</p>',
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const token = localStorage.getItem('token');
    
    // Fetch export data
    const response = await fetch('/api/export/products-excel', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export gagal');
    }

    // Create blob dari response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daftar_Produk_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✓ Export completed successfully');
    
    Swal.fire({
      title: 'Berhasil! ✓',
      text: 'File telah didownload',
      icon: 'success',
      confirmButtonColor: '#28a745',
      confirmButtonText: '✓ OK'
    });
  } catch (error) {
    console.error('❌ Export error:', error);
    Swal.fire({
      title: 'Gagal!',
      text: 'Terjadi kesalahan saat export: ' + error.message,
      icon: 'error',
      confirmButtonColor: '#dc3545',
      confirmButtonText: '✓ OK'
    });
  }
}

// ============ HELPERS ============

// Function untuk search/filter produk
function searchProducts() {
  try {
    const keyword = document.getElementById('searchProduct').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
      const name = card.querySelector('.product-card-name')?.textContent.toLowerCase() || '';
      card.style.display = name.includes(keyword) ? 'block' : 'none';
    });
  } catch (error) {
    console.error('❌ Search error:', error);
  }
}

// Function untuk format harga ke format IDR
function formatPrice(price) {
  return new Intl.NumberFormat('id-ID').format(parseInt(price) || 0);
}

// Function untuk ambil nama kategori dari ID
function getCategoryName(categoryId) {
  const categories = {
    '1': 'Makanan',
    '2': 'Minuman',
    '3': 'Snack',
    '4': 'Elektronik',
    '5': 'Lainnya'
  };
  return categories[String(categoryId)] || 'Tidak Diketahui';
}

// Function untuk escape HTML string (security)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function untuk logout user
function logout() {
  Swal.fire({
    title: 'Keluar dari Aplikasi?',
    text: 'Anda akan logout dan kembali ke halaman login',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('✓ User logged out');
      window.location.href = '/login';
    }
  });
}

// Function untuk menampilkan SweetAlert2 modal
function showAlertModal(title, message, type = 'success') {
  const iconMap = {
    'success': 'success',
    'danger': 'error',
    'warning': 'warning',
    'info': 'info'
  };

  const colorMap = {
    'success': '#28a745',
    'danger': '#dc3545',
    'warning': '#ffc107',
    'info': '#17a2b8'
  };

  Swal.fire({
    title: title,
    text: message,
    icon: iconMap[type] || 'info',
    confirmButtonColor: colorMap[type] || '#0d6efd',
    confirmButtonText: '✓ OK',
    allowOutsideClick: false,
    allowEscapeKey: false
  });
}

// ============ LOGGING ============

// Log ketika script berhasil dimuat
console.log('✓ App.js loaded successfully');

// ============ REPORTS ============

// Function untuk load laporan dari API
async function loadReports() {
  try {
    console.log('📊 Loading reports...');
    const response = await fetch('/api/reports', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('📊 Reports response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Reports data:', data);
      displayReports(data);
    } else {
      const errorData = await response.json();
      console.error('❌ Reports error:', errorData);
      displayReports({});
    }
  } catch (error) {
    console.error('⚠️ Error loading reports:', error);
    displayReports({});
  }
}

// Function untuk menampilkan laporan di dashboard
function displayReports(data) {
  try {
    // Set KPI values dengan default 0 jika undefined
    const todayTransactions = data.todayTransactions || 0;
    const todayRevenue = data.todayRevenue || 0;
    const weekTransactions = data.weekTransactions || 0;
    const lowStockCount = data.lowStockCount || 0;
    const topProducts = data.topProducts || [];
    
    console.log('📊 Displaying reports:');
    console.log('   Today Transactions:', todayTransactions);
    console.log('   Today Revenue:', todayRevenue);
    console.log('   Week Transactions:', weekTransactions);
    console.log('   Low Stock:', lowStockCount);
    console.log('   Top Products:', topProducts.length);
    
    // Update KPI cards dengan format yang lebih baik
    const todayTransEl = document.getElementById('todayTransactions');
    const todayRevEl = document.getElementById('todayRevenue');
    const weekTransEl = document.getElementById('weekTransactions');
    const lowStockEl = document.getElementById('lowStockCount');
    
    if (todayTransEl) todayTransEl.textContent = todayTransactions.toLocaleString('id-ID');
    if (todayRevEl) todayRevEl.textContent = 'Rp ' + formatPrice(todayRevenue);
    if (weekTransEl) weekTransEl.textContent = weekTransactions.toLocaleString('id-ID');
    if (lowStockEl) lowStockEl.textContent = lowStockCount.toLocaleString('id-ID');
    
    // Update top products table
    const tbody = document.getElementById('topProductsBody');
    if (!tbody) {
      console.warn('⚠️ topProductsBody element not found');
      return;
    }
    
    tbody.innerHTML = '';
    
    if (topProducts && topProducts.length > 0) {
      topProducts.forEach((product, index) => {
        const row = tbody.insertRow();
        const productSold = parseInt(product.sold) || 0;
        const productRevenue = parseInt(product.revenue) || 0;
        
        row.innerHTML = `
          <td>
            <span class="badge bg-primary rounded-pill">${index + 1}</span>
          </td>
          <td>
            <strong>${escapeHtml(product.name)}</strong>
          </td>
          <td>
            <span class="badge bg-info">${productSold} unit</span>
          </td>
          <td>
            <strong class="text-success">Rp ${formatPrice(productRevenue)}</strong>
          </td>
        `;
      });
      console.log('✓ Top products displayed:', topProducts.length);
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;"><em class="text-muted">Belum ada data penjualan</em></td></tr>';
    }
    
    console.log('✓ Reports displayed');
  } catch (error) {
    console.error('❌ Display reports error:', error);
  }
}
