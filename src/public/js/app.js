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

// Menyimpan referensi chart instances untuk dark mode updates
let chartInstances = {
  dailyRevenue: null,
  topProductsPie: null,
  topSales: null,
  revenue: null
};

// Menyimpan data charts untuk re-rendering
let chartsData = {
  isDarkMode: false,
  textColor: '#6b7280',
  gridColor: '#e5e7eb',
  dailyData: [],
  topProducts: []
};

// Menyimpan selected products untuk bulk operations
let selectedProducts = new Set();

// ============ DARK MODE MANAGEMENT ============

/**
 * Initialize dark mode from localStorage or system preference
 */
function initializeDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const savedTheme = localStorage.getItem('theme');
  
  // Tentukan theme berdasarkan preferensi tersimpan atau default ke dark
  let theme = savedTheme || 'dark'; // Default to dark mode
  
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
  
  // Update charts if they exist - dengan error handling
  setTimeout(() => {
    try {
      updateChartsForDarkMode();
    } catch (error) {
      console.warn('⚠️ Chart update failed (charts may not be loaded yet):', error.message);
    }
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
    
    // Initialize dark mode FIRST - sebelum yang lain
    try {
      initializeDarkMode();
      console.log('✓ Dark mode initialized');
    } catch (dmError) {
      console.error('❌ Dark mode initialization failed:', dmError);
    }
    
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
      loadDashboard().catch(e => console.warn('⚠️ Dashboard load failed:', e)),
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
      dashboard: 'Dashboard',
      products: 'Data Produk',
      stockin: 'Barang Masuk',
      stock: 'Stok Barang',
      pos: 'Kasir',
      transactions: 'Riwayat Transaksi',
      reports: 'Laporan'
    };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      pageTitle.textContent = titles[pageName] || 'Page';
    }
    
    // Reload data jika diperlukan
    if (pageName === 'dashboard') {
      console.log('🔄 Reloading dashboard...');
      loadDashboard();
    } else {
      // Clear dashboard refresh interval when leaving dashboard
      if (typeof dashboardRefreshInterval !== 'undefined' && dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
        dashboardRefreshInterval = null;
      }
    }
    if (pageName === 'products') {
      console.log('🔄 Reloading products...');
      loadProducts();
    }
    if (pageName === 'stockin') {
      console.log('🔄 Reloading stock in...');
      initStockInPage();
    }
    if (pageName === 'stock') {
      console.log('🔄 Reloading stock display...');
      loadStockDisplay();
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
    
    // JANGAN clear selection otomatis - biarkan user memilih kapan mau clear
    // clearProductSelection();
    
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
    // Tampilkan produk di table dengan tetap mempertahankan selection
    loadProductsTable();
    // Update selection toolbar setelah re-render
    updateSelectionToolbar();
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
    updateSelectionToolbar();
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
          <div class="product-card-header-content">
            <h4 class="product-card-name">${escapeHtml(product.name)}</h4>
            <div>
              ${product.stock < 5 && product.stock > 0 ? '<span class="product-card-badge">⚠️ Terbatas</span>' : ''}
              ${product.stock === 0 ? '<span class="product-card-badge" style="background: #ef4444;">Habis</span>' : ''}
            </div>
          </div>
        </div>
        <div class="product-card-content">
          <div>
            <div class="product-card-price">Rp ${formatPrice(product.sell_price || product.price || 0)}</div>
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

// ============ STOCK IN WRAPPER FUNCTIONS ============

/**
 * Wrapper function untuk load stock in form
 */
function loadStockInForm() {
  if (typeof initStockInPage === 'function') {
    initStockInPage();
  }
}

/**
 * Wrapper function untuk load stock in history
 * This function is defined in stockin.js - just call it if available
 */
function loadStockInHistoryWrapper() {
  if (typeof loadStockInHistory === 'function') {
    window.loadStockInHistory();
  }
}

// Function untuk menampilkan produk di table (halaman Products)
function loadProductsTable(productsToShow = null) {
  try {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) {
      console.error('❌ productsTableBody element not found');
      return;
    }
    
    const displayProducts = productsToShow || products;
    
    // Update counter
    document.getElementById('productFilterCount').textContent = displayProducts.length;
    document.getElementById('productTotalCount').textContent = products.length;
    
    // Clear table terlebih dahulu
    tbody.innerHTML = '';
    console.log('📋 Loading products table with', displayProducts.length, 'items');
    
    // Jika tidak ada produk, tampilkan pesan
    if (displayProducts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;"><i class="bi bi-inbox"></i> Tidak ada produk yang sesuai</td></tr>';
      return;
    }
    
    // Loop setiap produk dan buat row table
    displayProducts.forEach((product, index) => {
      const row = tbody.insertRow();
      // Tentukan status badge stok
      const stockStatus = product.stock === 0 ? 'danger' : product.stock < 10 ? 'warning' : 'success';
      const isSelected = selectedProducts.has(product.id);
      
      // Buat HTML untuk row table dengan checkbox
      row.innerHTML = `
        <td>
          <input type="checkbox" class="form-check-input product-checkbox" 
                 data-product-id="${product.id}" 
                 ${isSelected ? 'checked' : ''}
                 onchange="toggleProductSelection(${product.id}, this)">
        </td>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(product.name)}</strong></td>
        <td><span class="badge badge-info">${escapeHtml(product.sku)}</span></td>
        <td>${getCategoryName(product.category)}</td>
        <td>Rp ${formatPrice(product.sell_price || product.price || 0)}</td>
        <td><span class="badge badge-${stockStatus}">${product.stock} unit</span></td>
        <td>
          <div class="table-actions">
            <button class="table-btn table-btn-primary" onclick="editProduct(${product.id})">✏️ Edit</button>
            <button class="table-btn table-btn-success" onclick="duplicateProduct(${product.id}, '${escapeHtml(product.name).replace(/'/g, "\\'")}')">📋 Duplikat</button>
            <button class="table-btn table-btn-danger" onclick="deleteProduct(${product.id})">🗑️ Hapus</button>
          </div>
        </td>
      `;
      
      // Add highlight effect untuk selected rows
      if (isSelected) {
        row.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
      }
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
        
        // Format price dengan Rp dan separator
        const priceValue = product.sell_price || product.price || 0;
        const priceInput = document.getElementById('productPrice');
        priceInput.value = 'Rp ' + (priceValue ? parseInt(priceValue).toLocaleString('id-ID') : '0');
        
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
    // Extract angka murni dari input yang sudah diformat (remove 'Rp ' dan separator)
    const productPriceInput = document.getElementById('productPrice').value;
    const productPrice = parseInt(productPriceInput.replace(/\D/g, '')) || 0;
    const productStock = parseInt(document.getElementById('productStock').value) || 0;
    const productImageFile = document.getElementById('productImage').files[0];
    
    // Validasi input
    if (!productName) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal!',
        text: 'Nama produk harus diisi',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      return;
    }
    if (!productSku) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal!',
        text: 'SKU harus diisi',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      return;
    }
    if (productPrice <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal!',
        text: 'Harga harus lebih dari 0',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      return;
    }
    if (productStock < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal!',
        text: 'Stok tidak boleh negatif',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      return;
    }
    
    // Ambil token
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Session Expired!',
        text: 'Token expired, silakan login kembali',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      }).then(() => {
        window.location.href = '/login';
      });
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
    const actionType = productId ? 'diperbarui' : 'ditambahkan';
    
    console.log(`📡 ${method} ${url}`);
    console.log('Sending FormData with image...');
    
    // Tampilkan loading dialog
    Swal.fire({
      title: 'Memproses...',
      html: '<p>Sedang menyimpan produk...</p>',
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
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
      let successMessage = `Produk "${productName}" berhasil ${actionType}`;
      
      // Tutup modal dan reload data
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: successMessage,
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
        timer: 2000,
        timerProgressBar: true
      }).then(() => {
        closeProductModal();
        loadProducts();
      });
    } else {
      // Handle error response
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('❌ API Error:', response.status, errorData);
      
      const errorMessage = errorData.message || 'Gagal menyimpan produk';
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan!',
        text: errorMessage,
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    }
  } catch (error) {
    console.error('❌ Save product error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Terjadi Kesalahan!',
      text: 'Error: ' + error.message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545'
    });
  }
}

// Function untuk edit produk
async function editProduct(productId) {
  openProductModal(productId);
}

// Function untuk duplicate produk
async function duplicateProduct(productId, productName) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/products/${productId}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      showAlertModal('Berhasil!', `Produk "${productName}" berhasil diduplikat`, 'success');
      loadProducts();
    } else {
      const error = await response.json();
      showAlertModal('Gagal!', error.message || 'Gagal menduplikat produk', 'danger');
    }
  } catch (error) {
    console.error('❌ Duplicate product error:', error);
    showAlertModal('Error!', 'Terjadi kesalahan saat menduplikat produk', 'danger');
  }
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Delete response status:', response.status);
        const data = await response.json();
        console.log('Delete response data:', data);
        
        // Jika sukses
        if (response.ok) {
          // Hapus dari array products
          products = products.filter(p => p.id !== productId);
          showAlertModal('Berhasil!', 'Produk berhasil dihapus', 'success');
          // Reload halaman produk
          loadProducts();
        } else {
          // Tampilkan error message dari backend
          const errorMsg = data.message || data.error || 'Gagal menghapus produk';
          console.error('Delete error response:', errorMsg);
          showAlertModal('Gagal!', errorMsg, 'danger');
        }
      } catch (error) {
        console.error('❌ Delete error:', error);
        showAlertModal('Error!', 'Terjadi kesalahan: ' + error.message, 'danger');
      }
    }
  });
}

// ============ PRODUCT SELECTION SYSTEM ============

/**
 * Toggle selection untuk satu produk
 */
function toggleProductSelection(productId, checkbox) {
  if (checkbox.checked) {
    selectedProducts.add(productId);
    console.log(`✓ Product ${productId} selected`);
  } else {
    selectedProducts.delete(productId);
    console.log(`✗ Product ${productId} deselected`);
  }
  
  updateSelectionToolbar();
  updateSelectAllCheckbox();
}

/**
 * Toggle select all checkbox
 */
function toggleSelectAllProducts(checkbox) {
  const checkboxes = document.querySelectorAll('.product-checkbox');
  
  if (checkbox.checked) {
    // Select semua
    checkboxes.forEach(cb => {
      const productId = parseInt(cb.dataset.productId);
      selectedProducts.add(productId);
      cb.checked = true;
    });
    console.log('✓ All products selected');
  } else {
    // Deselect semua
    checkboxes.forEach(cb => {
      const productId = parseInt(cb.dataset.productId);
      selectedProducts.delete(productId);
      cb.checked = false;
    });
    console.log('✗ All products deselected');
    selectedProducts.clear();
  }
  
  updateSelectionToolbar();
}

/**
 * Update select all checkbox state
 */
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('selectAllProducts');
  const checkboxes = document.querySelectorAll('.product-checkbox');
  const totalChecked = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  if (totalChecked === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (totalChecked === checkboxes.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

/**
 * Update tampilan toolbar berdasarkan selection
 */
function updateSelectionToolbar() {
  const toolbar = document.getElementById('productSelectionToolbar');
  const selectedCount = document.getElementById('selectedCount');
  
  if (selectedProducts.size > 0) {
    toolbar.style.display = 'flex';
    toolbar.classList.add('show');
    selectedCount.textContent = selectedProducts.size;
    
    // Update row highlights
    document.querySelectorAll('#productsTableBody tr').forEach(row => {
      const checkbox = row.querySelector('.product-checkbox');
      if (checkbox && checkbox.checked) {
        row.style.backgroundColor = 'rgba(13, 110, 253, 0.08)';
      } else {
        row.style.backgroundColor = '';
      }
    });
  } else {
    toolbar.style.display = 'none';
    toolbar.classList.remove('show');
    selectedCount.textContent = '0';
    document.querySelectorAll('#productsTableBody tr').forEach(row => {
      row.style.backgroundColor = '';
    });
  }
}

/**
 * Clear semua selection
 */
function clearProductSelection() {
  selectedProducts.clear();
  document.querySelectorAll('.product-checkbox').forEach(cb => {
    cb.checked = false;
  });
  document.getElementById('selectAllProducts').checked = false;
  updateSelectionToolbar();
  console.log('🗑️ Selection cleared');
}

/**
 * Bulk duplicate selected products
 */
async function bulkDuplicateProducts() {
  const count = selectedProducts.size;
  
  if (count === 0) {
    showAlertModal('Peringatan!', 'Pilih minimal 1 produk untuk diduplikat', 'warning');
    return;
  }
  
  // Konfirmasi
  Swal.fire({
    title: 'Duplikat Produk?',
    text: `${count} produk akan diduplikat`,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Duplikat',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        let successCount = 0;
        let failCount = 0;
        
        // Duplicate setiap produk
        for (const productId of selectedProducts) {
          try {
            const response = await fetch(`/api/products/${productId}/duplicate`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
            console.error('Error duplicating product:', error);
          }
        }
        
        // Reload data
        await loadProducts();
        clearProductSelection();
        
        // Tampilkan hasil
        if (failCount === 0) {
          showAlertModal('Berhasil!', `${successCount} produk berhasil diduplikat`, 'success');
        } else {
          showAlertModal('Sebagian Berhasil', `${successCount} berhasil, ${failCount} gagal`, 'warning');
        }
      } catch (error) {
        console.error('❌ Bulk duplicate error:', error);
        showAlertModal('Error!', 'Terjadi kesalahan saat menduplikat', 'danger');
      }
    }
  });
}

/**
 * Bulk delete selected products
 */
async function bulkDeleteProducts() {
  const count = selectedProducts.size;
  
  if (count === 0) {
    showAlertModal('Peringatan!', 'Pilih minimal 1 produk untuk dihapus', 'warning');
    return;
  }
  
  // Konfirmasi dengan warning
  Swal.fire({
    title: 'Hapus Produk?',
    text: `${count} produk akan dihapus dan tidak dapat dikembalikan`,
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
        let successCount = 0;
        let failCount = 0;
        
        // Delete setiap produk
        for (const productId of selectedProducts) {
          try {
            const response = await fetch(`/api/products/${productId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              successCount++;
              // Remove dari array
              products = products.filter(p => p.id !== productId);
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
            console.error('Error deleting product:', error);
          }
        }
        
        // Reload data
        await loadProducts();
        clearProductSelection();
        
        // Tampilkan hasil
        if (failCount === 0) {
          showAlertModal('Berhasil!', `${successCount} produk berhasil dihapus`, 'success');
        } else {
          showAlertModal('Sebagian Berhasil', `${successCount} berhasil, ${failCount} gagal`, 'warning');
        }
      } catch (error) {
        console.error('❌ Bulk delete error:', error);
        showAlertModal('Error!', 'Terjadi kesalahan saat menghapus', 'danger');
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
      // Jika belum ada, tambahkan item baru dengan dukungan diskon per item
      cart.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: product.sell_price || product.price || 0,
        buy_price: product.buy_price || 0,
        quantity: 1,
        discount: 0,  // Diskon per item dalam rupiah
        discount_percent: 0  // Diskon per item dalam persen
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
      const itemSubtotal = item.price * item.quantity;
      const itemDiscount = item.discount || 0;
      const itemAfterDiscount = itemSubtotal - itemDiscount;
      
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-detail">Rp ${formatPrice(item.price)} x ${item.quantity}</div>
          ${itemDiscount > 0 ? `<div class="cart-item-detail" style="color: #dc3545; font-size: 12px;">Diskon: -Rp ${formatPrice(itemDiscount)}</div>` : ''}
        </div>
        <div class="cart-item-qty">
          <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-sm btn-outline-secondary" onclick="editItemDiscount(${item.id})" title="Edit diskon item">
            <i class="bi bi-percent"></i>
          </button>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
        </div>
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
    // Ambil nilai diskon transaksi keseluruhan
    const transactionDiscount = parseInt(document.getElementById('discount').value) || 0;
    let subtotal = 0;
    let totalItemDiscounts = 0;
    
    // Hitung subtotal dan diskon per item
    cart.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      totalItemDiscounts += (item.discount || 0);
    });
    
    // Hitung total: subtotal - (diskon item + diskon transaksi)
    const totalDiscount = totalItemDiscounts + transactionDiscount;
    const total = Math.max(0, subtotal - totalDiscount);
    
    // Update elemen DOM
    document.getElementById('subtotal').textContent = 'Rp ' + formatPrice(subtotal);
    document.getElementById('total').textContent = 'Rp ' + formatPrice(total);
  } catch (error) {
    console.error('❌ Update total error:', error);
  }
}

// Function untuk format currency input secara real-time
function formatCurrencyInput(input) {
  try {
    // Ambil hanya angka dari input
    let value = input.value.replace(/\D/g, '');
    
    // Format dengan separator ribuan
    if (value) {
      value = parseInt(value).toLocaleString('id-ID');
      input.value = 'Rp ' + value;
    } else {
      input.value = '';
    }
  } catch (error) {
    console.error('❌ Format currency input error:', error);
  }
}

// Function untuk hitung kembalian
function calculateChange() {
  try {
    // Ambil total dan uang yang diterima
    const total = getTotalAmount();
    
    // Extract angka dari input (remove 'Rp ' dan separator)
    const cashReceivedInput = document.getElementById('cashReceived').value;
    const received = parseInt(cashReceivedInput.replace(/\D/g, '')) || 0;
    
    // Hitung kembalian
    const change = Math.max(0, received - total);
    
    // Update elemen DOM dengan format Rupiah
    document.getElementById('changeAmount').textContent = 'Rp ' + formatPrice(change);
  } catch (error) {
    console.error('❌ Calculate change error:', error);
  }
}

// Function untuk ambil total amount
function getTotalAmount() {
  const transactionDiscount = parseInt(document.getElementById('discount').value) || 0;
  let subtotal = 0;
  let totalItemDiscounts = 0;
  
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    totalItemDiscounts += (item.discount || 0);
  });
  
  const totalDiscount = totalItemDiscounts + transactionDiscount;
  return Math.max(0, subtotal - totalDiscount);
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
      // Set placeholder kembali ke Rp 0
      document.getElementById('cashReceived').placeholder = 'Rp 0';
      console.log('✓ Cart cleared');
    }
  });
}

// Function untuk edit diskon per item
function editItemDiscount(productId) {
  try {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    const itemTotal = item.price * item.quantity;
    
    Swal.fire({
      title: `Edit Diskon - ${item.name}`,
      html: `
        <div style="text-align: left;">
          <p><strong>Subtotal Item:</strong> Rp ${formatPrice(itemTotal)}</p>
          <div style="margin-bottom: 10px;">
            <label for="discountAmount" style="display: block; margin-bottom: 5px; font-weight: 500;">Diskon (Rp):</label>
            <input type="number" id="discountAmount" class="form-control" value="${item.discount || 0}" min="0" max="${itemTotal}" step="100" />
          </div>
          <div>
            <label for="discountPercent" style="display: block; margin-bottom: 5px; font-weight: 500;">Atau Diskon (%):</label>
            <input type="number" id="discountPercent" class="form-control" value="${item.discount_percent || 0}" min="0" max="100" step="1" />
          </div>
          <small style="color: #6b7280;">Masukkan diskon dalam Rp atau %. Yang terakhir diisi akan digunakan.</small>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      didOpen: () => {
        const amountInput = document.getElementById('discountAmount');
        const percentInput = document.getElementById('discountPercent');
        
        // Ketika user input persentase, konversi ke rupiah
        percentInput.addEventListener('change', () => {
          const percent = parseInt(percentInput.value) || 0;
          if (percent > 0) {
            const amount = Math.round((itemTotal * percent) / 100);
            amountInput.value = amount;
          }
        });
        
        // Ketika user input rupiah, konversi ke persentase
        amountInput.addEventListener('change', () => {
          const amount = parseInt(amountInput.value) || 0;
          if (amount > 0) {
            const percent = Math.round((amount / itemTotal) * 100);
            percentInput.value = percent;
          } else {
            percentInput.value = 0;
          }
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const finalAmount = parseInt(document.getElementById('discountAmount').value) || 0;
        const finalPercent = parseInt(document.getElementById('discountPercent').value) || 0;
        
        // Validasi diskon tidak boleh lebih dari total item
        if (finalAmount > itemTotal) {
          showAlertModal('Error!', 'Diskon tidak boleh lebih dari total item', 'danger');
          return;
        }
        
        item.discount = finalAmount;
        item.discount_percent = finalPercent;
        
        displayCart();
        updateTotal();
        showAlertModal('Berhasil!', `Diskon disimpan untuk ${item.name}`, 'success');
      }
    });
  } catch (error) {
    console.error('❌ Edit item discount error:', error);
  }
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
    // Extract angka murni dari input (remove 'Rp ' dan separator)
    const cashReceivedInput = document.getElementById('cashReceived').value;
    const received = parseInt(cashReceivedInput.replace(/\D/g, '')) || 0;
    
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
      discount: parseInt(document.getElementById('discount').value) || 0,
      cash_received: received,
      change_amount: received - total
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
          <button class="btn btn-sm btn-danger ms-2" onclick="deleteTransaction(${trans.id})">🗑️ Hapus</button>
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
        width: '500px',
        didOpen: (modal) => {
          // Tambahkan tombol print setelah modal terbuka
          const confirmButton = modal.querySelector('.swal2-confirm');
          const printButton = document.createElement('button');
          printButton.className = 'btn btn-success';
          printButton.style.cssText = `
            padding: 8px 16px; 
            margin-right: 10px; 
            font-size: 14px; 
            font-weight: 500;
            cursor: pointer;
            border: none;
            border-radius: 6px;
            background-color: #198754;
            color: white;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          `;
          printButton.innerHTML = '<i class="bi bi-printer"></i> Cetak Resi';
          printButton.onmouseover = () => {
            printButton.style.backgroundColor = '#157347';
            printButton.style.transform = 'translateY(-2px)';
            printButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          };
          printButton.onmouseout = () => {
            printButton.style.backgroundColor = '#198754';
            printButton.style.transform = 'translateY(0)';
            printButton.style.boxShadow = 'none';
          };
          printButton.onclick = () => printReceipt(trans, items, subtotal, discount, total, invoiceNumber);
          
          // Style confirm button juga
          if (confirmButton) {
            confirmButton.style.cssText = `
              padding: 8px 16px;
              font-size: 14px;
              font-weight: 500;
              border: none;
              border-radius: 6px;
              background-color: #0d6efd;
              color: white;
              cursor: pointer;
              transition: all 0.3s ease;
            `;
          }
          
          // Insert button sebelum confirm button
          if (confirmButton && confirmButton.parentNode) {
            confirmButton.parentNode.insertBefore(printButton, confirmButton);
          }
        }
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

// Function untuk delete transaksi
async function deleteTransaction(transactionId) {
  try {
    console.log(`🗑️  Deleting transaction ${transactionId}...`);
    
    // Cari transaksi untuk konfirmasi
    const trans = transactions.find(t => t.id === transactionId);
    if (!trans) {
      Swal.fire({
        title: 'Error!',
        text: 'Transaksi tidak ditemukan',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    // Konfirmasi delete dengan SweetAlert2
    const result = await Swal.fire({
      title: 'Hapus Transaksi?',
      html: `
        <div style="text-align: left;">
          <p class="swal-dark-text">Apakah Anda yakin ingin menghapus transaksi berikut?</p>
          <div class="swal-dark-info-box" style="background: rgba(255, 193, 7, 0.15); border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin: 15px 0;">
            <strong style="display: block; margin-bottom: 6px;">No. Invoice:</strong>
            <code style="background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 4px; word-break: break-all;">${escapeHtml(trans.invoiceNumber || trans.invoice_number || 'N/A')}</code>
            <br><br>
            <strong style="display: block; margin-bottom: 6px;">Total:</strong>
            <span style="font-size: 1.1em; font-weight: bold;">Rp ${formatPrice(trans.total || 0)}</span>
          </div>
          <p class="swal-dark-warning" style="color: #ffc107; font-weight: bold; margin-bottom: 0;">⚠️ Stok produk akan dikembalikan otomatis!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🗑️ Hapus Transaksi',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-html',
        confirmButton: 'swal-confirm-delete',
        cancelButton: 'swal-cancel-btn'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    // Show loading
    Swal.fire({
      title: 'Menghapus...',
      html: '<p class="swal-dark-text">Sedang menghapus transaksi...</p>',
      icon: 'info',
      allowOutsideClick: false,
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-html'
      },
      didOpen: async () => {
        try {
          const response = await fetch(`/api/transactions/${transactionId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✓ Transaction deleted:', data);

            // Reload transactions
            await loadTransactions();

            Swal.fire({
              title: 'Berhasil!',
              text: 'Transaksi berhasil dihapus. Stok produk telah dikembalikan.',
              icon: 'success',
              confirmButtonColor: '#0d6efd',
              customClass: {
                popup: 'swal-dark-popup',
                title: 'swal-dark-title',
                htmlContainer: 'swal-dark-html'
              }
            });
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal menghapus transaksi');
          }
        } catch (error) {
          console.error('❌ Delete error:', error);
          Swal.fire({
            title: 'Error!',
            text: error.message || 'Gagal menghapus transaksi',
            icon: 'error',
            confirmButtonColor: '#dc3545',
            customClass: {
              popup: 'swal-dark-popup',
              title: 'swal-dark-title',
              htmlContainer: 'swal-dark-html'
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('❌ Delete transaction error:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Terjadi kesalahan: ' + error.message,
      icon: 'error',
      confirmButtonColor: '#dc3545',
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-html'
      }
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

// Function untuk search/filter produk di POS (product cards)
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

// Function untuk filter produk di Data Produk page
function filterProductsAdvanced() {
  try {
    const searchKeyword = document.getElementById('productSearchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('productCategoryFilter').value;
    const selectedStockStatus = document.getElementById('productStockFilter').value;
    
    const filtered = products.filter(product => {
      // Search filter (nama, SKU, kategori)
      const name = product.name.toLowerCase();
      const sku = product.sku.toLowerCase();
      const category = getCategoryName(product.category).toLowerCase();
      const matchesSearch = name.includes(searchKeyword) || sku.includes(searchKeyword) || category.includes(searchKeyword);
      
      // Category filter
      const productCategory = getCategoryName(product.category);
      const matchesCategory = !selectedCategory || productCategory === selectedCategory;
      
      // Stock status filter
      let matchesStock = true;
      if (selectedStockStatus === 'normal') {
        matchesStock = product.stock >= 10;
      } else if (selectedStockStatus === 'low') {
        matchesStock = product.stock > 0 && product.stock < 10;
      } else if (selectedStockStatus === 'empty') {
        matchesStock = product.stock === 0;
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    });
    
    console.log(`🔍 Filtered to ${filtered.length} products`);
    loadProductsTable(filtered);
  } catch (error) {
    console.error('❌ Filter error:', error);
  }
}

// Function untuk reset semua filter
function resetProductFilters() {
  try {
    document.getElementById('productSearchInput').value = '';
    document.getElementById('productCategoryFilter').value = '';
    document.getElementById('productStockFilter').value = '';
    filterProductsAdvanced();
    console.log('✓ Filters reset');
  } catch (error) {
    console.error('❌ Reset error:', error);
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
        const productSold = parseInt(product.total_qty || product.sold) || 0;
        const productRevenue = parseInt(product.total_revenue || product.revenue) || 0;
        const productId = product.id;
        const productName = product.name;
        
        row.innerHTML = `
          <td>
            <span class="badge bg-primary rounded-pill">${index + 1}</span>
          </td>
          <td>
            <strong>${escapeHtml(productName)}</strong>
          </td>
          <td>
            <span class="badge bg-info">${productSold} unit</span>
          </td>
          <td>
            <strong class="text-success">Rp ${formatPrice(productRevenue)}</strong>
          </td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteProductFromReport(${productId}, '${escapeHtml(productName).replace(/'/g, "\\'")}')">🗑️ Hapus</button>
          </td>
        `;
      });
      console.log('✓ Top products displayed:', topProducts.length);
    } else {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;"><em class="text-muted">Belum ada data penjualan</em></td></tr>';
    }
    
    // Initialize ApexCharts
    initializeCharts(data);
    
    console.log('✓ Reports displayed');
  } catch (error) {
    console.error('❌ Display reports error:', error);
  }
}
// Function untuk delete produk dari laporan
async function deleteProductFromReport(productId, productName) {
  try {
    console.log(`🗑️ Deleting product ${productId}...`);

    // Konfirmasi delete dengan SweetAlert2
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      html: `
        <div style="text-align: left;">
          <p class="swal-dark-text">Apakah Anda yakin ingin menghapus produk berikut?</p>
          <div class="swal-dark-info-box" style="background: rgba(220, 53, 69, 0.15); border: 1px solid #dc3545; border-radius: 6px; padding: 12px; margin: 15px 0;">
            <strong style="display: block; margin-bottom: 6px;">Nama Produk:</strong>
            <span style="font-size: 1.05em;">${escapeHtml(productName)}</span>
          </div>
          <p class="swal-dark-warning" style="color: #ffc107; font-weight: bold; margin-bottom: 0;">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🗑️ Hapus Produk',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-html',
        confirmButton: 'swal-confirm-delete',
        cancelButton: 'swal-cancel-btn'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    // Show loading
    Swal.fire({
      title: 'Menghapus...',
      html: '<p class="swal-dark-text">Sedang menghapus produk...</p>',
      icon: 'info',
      allowOutsideClick: false,
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-html'
      },
      didOpen: async () => {
        try {
          const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✓ Product deleted:', data);

            // Reload reports
            await loadReports();

            Swal.fire({
              title: 'Berhasil!',
              text: `Produk "${productName}" berhasil dihapus.`,
              icon: 'success',
              confirmButtonColor: '#0d6efd',
              customClass: {
                popup: 'swal-dark-popup',
                title: 'swal-dark-title',
                htmlContainer: 'swal-dark-html'
              }
            });
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal menghapus produk');
          }
        } catch (error) {
          console.error('❌ Delete error:', error);
          Swal.fire({
            title: 'Error!',
            text: error.message || 'Gagal menghapus produk',
            icon: 'error',
            confirmButtonColor: '#dc3545',
            customClass: {
              popup: 'swal-dark-popup',
              title: 'swal-dark-title',
              htmlContainer: 'swal-dark-html'
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Terjadi kesalahan: ' + error.message,
      icon: 'error',
      confirmButtonColor: '#dc3545',
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-html'
      }
    });
  }
}

// ============ APEX CHARTS FUNCTIONS ============

/**
 * Initialize ApexCharts untuk dashboard
 */
function initializeCharts(data) {
  try {
    console.log('📈 Initializing ApexCharts...');
    console.log('📊 Data received:', data);
    
    // Check if ApexCharts is loaded
    if (typeof ApexCharts === 'undefined') {
      console.warn('⚠️ ApexCharts not loaded yet, retrying in 500ms...');
      setTimeout(() => initializeCharts(data), 500);
      return;
    }
    
    // Get theme
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#a0aec0' : '#6b7280';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
    
    // Chart color palette
    const colors = ['#0d6efd', '#198754', '#ffc107', '#fd7e14', '#e83e8c', '#6f42c1'];
    
    // Get data
    const topProducts = data.topProducts || [];
    const dailyData = data.dailyData || [];
    
    // Store chart data for later updates
    chartsData = {
      isDarkMode,
      textColor,
      gridColor,
      colors,
      dailyData,
      topProducts
    };
    
    console.log('📈 Daily data:', dailyData);
    console.log('🏆 Top products:', topProducts);
    
    // Initialize Daily Revenue Chart
    initializeDailyRevenueChart(isDarkMode, textColor, gridColor, dailyData);
    
    // Initialize Top Products Pie Chart
    if (topProducts.length > 0) {
      initializeTopProductsPieChart(isDarkMode, textColor, colors, topProducts);
      initializeTopSalesChart(isDarkMode, textColor, gridColor, colors, topProducts);
      initializeRevenueChart(isDarkMode, textColor, gridColor, colors, topProducts);
    } else {
      console.warn('⚠️ No top products data available');
    }
    
    console.log('✓ Charts initialized');
  } catch (error) {
    console.error('❌ Error initializing charts:', error);
  }
}

/**
 * Initialize Daily Revenue Chart (Line Chart)
 */
function initializeDailyRevenueChart(isDarkMode, textColor, gridColor, dailyData) {
  const chartElement = document.getElementById('dailyRevenueChart');
  if (!chartElement) {
    console.warn('⚠️ dailyRevenueChart element not found');
    return;
  }
  
  // Destroy existing chart instance
  if (chartInstances.dailyRevenue) {
    chartInstances.dailyRevenue.destroy();
  }
  
  console.log('📊 Rendering daily revenue chart with data:', dailyData);
  
  // Generate last 7 days data if not provided or empty
  let data = [];
  if (!dailyData || dailyData.length === 0) {
    console.warn('⚠️ No daily data provided, generating placeholder data');
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: 0
      });
    }
  } else {
    data = Array.isArray(dailyData) ? dailyData : [];
    console.log('✓ Using actual daily data:', data);
  }
  
  const options = {
    series: [{
      name: 'Pendapatan',
      data: data.map(d => d.revenue || 0)
    }],
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      background: isDarkMode ? '#1f2937' : '#ffffff',
      foreColor: textColor
    },
    colors: ['#0d6efd'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.1
      }
    },
    xaxis: {
      categories: data.map(d => d.date),
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        },
        formatter: (value) => 'Rp ' + (value / 1000000).toFixed(1) + 'M'
      }
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (value) => 'Rp ' + formatPrice(value)
      }
    }
  };
  
  try {
    const chart = new ApexCharts(chartElement, options);
    chart.render();
    chartInstances.dailyRevenue = chart;
    console.log('✓ Daily revenue chart rendered');
  } catch (err) {
    console.error('❌ Error rendering daily revenue chart:', err);
  }
}

/**
 * Initialize Top Products Pie Chart
 */
function initializeTopProductsPieChart(isDarkMode, textColor, colors, topProducts) {
  const chartElement = document.getElementById('topProductsPieChart');
  if (!chartElement) return;
  
  // Destroy existing chart instance
  if (chartInstances.topProductsPie) {
    chartInstances.topProductsPie.destroy();
  }
  
  // Get top 5 products
  const topFive = topProducts.slice(0, 5);
  
  // Handle empty data
  if (topFive.length === 0) {
    chartElement.innerHTML = '<div style="padding: 20px; text-align: center; color: ' + textColor + ';">Tidak ada data penjualan</div>';
    return;
  }
  
  const options = {
    series: topFive.map(p => parseInt(p.sold) || 0),
    chart: {
      type: 'pie',
      height: 350,
      background: isDarkMode ? '#1f2937' : '#ffffff',
      foreColor: textColor
    },
    colors: colors.slice(0, topFive.length),
    labels: topFive.map(p => p.name),
    legend: {
      position: 'bottom',
      labels: {
        colors: textColor
      }
    },
    dataLabels: {
      style: {
        colors: [textColor]
      }
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (value) => value + ' unit'
      }
    }
  };
  
  try {
    const chart = new ApexCharts(chartElement, options);
    chart.render();
    chartInstances.topProductsPie = chart;
  } catch (err) {
    console.error('❌ Error rendering pie chart:', err);
  }
}

/**
 * Initialize Top Sales Chart (Bar Chart)
 */
function initializeTopSalesChart(isDarkMode, textColor, gridColor, colors, topProducts) {
  const chartElement = document.getElementById('topSalesChart');
  if (!chartElement) return;
  
  // Destroy existing chart instance
  if (chartInstances.topSales) {
    chartInstances.topSales.destroy();
  }
  
  // Get top 8 products
  const topEight = topProducts.slice(0, 8);
  
  // Handle empty data
  if (topEight.length === 0) {
    chartElement.innerHTML = '<div style="padding: 20px; text-align: center; color: ' + textColor + ';">Tidak ada data penjualan</div>';
    return;
  }
  
  const options = {
    series: [{
      name: 'Terjual (Unit)',
      data: topEight.map(p => parseInt(p.sold) || 0)
    }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true
        }
      },
      background: isDarkMode ? '#1f2937' : '#ffffff',
      foreColor: textColor
    },
    colors: ['#198754'],
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetX: 0,
      style: {
        fontSize: '12px',
        colors: [textColor]
      }
    },
    xaxis: {
      categories: topEight.map(p => p.name.substring(0, 15) + (p.name.length > 15 ? '...' : '')),
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: gridColor
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (value) => value + ' unit'
      }
    }
  };
  
  try {
    const chart = new ApexCharts(chartElement, options);
    chart.render();
    chartInstances.topSales = chart;
  } catch (err) {
    console.error('❌ Error rendering top sales chart:', err);
  }
}

/**
 * Initialize Revenue Chart (Bar Chart)
 */
function initializeRevenueChart(isDarkMode, textColor, gridColor, colors, topProducts) {
  const chartElement = document.getElementById('revenueChart');
  if (!chartElement) return;
  
  // Destroy existing chart instance
  if (chartInstances.revenue) {
    chartInstances.revenue.destroy();
  }
  
  // Get top 8 products
  const topEight = topProducts.slice(0, 8);
  
  // Handle empty data
  if (topEight.length === 0) {
    chartElement.innerHTML = '<div style="padding: 20px; text-align: center; color: ' + textColor + ';">Tidak ada data penjualan</div>';
    return;
  }
  
  const options = {
    series: [{
      name: 'Pendapatan',
      data: topEight.map(p => parseInt(p.revenue) || 0)
    }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true
        }
      },
      background: isDarkMode ? '#1f2937' : '#ffffff',
      foreColor: textColor
    },
    colors: ['#ffc107'],
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetX: 0,
      style: {
        fontSize: '12px',
        colors: [textColor]
      },
      formatter: (value) => 'Rp ' + (value / 1000000).toFixed(1) + 'M'
    },
    xaxis: {
      categories: topEight.map(p => p.name.substring(0, 15) + (p.name.length > 15 ? '...' : '')),
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: gridColor
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (value) => 'Rp ' + formatPrice(value)
      }
    }
  };
  
  try {
    const chart = new ApexCharts(chartElement, options);
    chart.render();
    chartInstances.revenue = chart;
  } catch (err) {
    console.error('❌ Error rendering revenue chart:', err);
  }
}

/**
 * Update all charts when dark mode is toggled
 */
function updateChartsForDarkMode() {
  console.log('🌙 Updating charts for dark mode...');
  
  // Check if chart data is available
  if (!chartsData) {
    console.warn('⚠️ Chart data not initialized yet');
    return;
  }
  
  // Get new theme colors
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDarkMode ? '#a0aec0' : '#6b7280';
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
  
  console.log('🎨 Theme colors updated:', { isDarkMode, textColor, gridColor });
  
  try {
    // Re-initialize daily revenue chart if data exists
    if (chartsData.dailyData && chartsData.dailyData.length > 0) {
      try {
        initializeDailyRevenueChart(isDarkMode, textColor, gridColor, chartsData.dailyData);
      } catch (e) {
        console.warn('⚠️ Daily revenue chart update failed:', e.message);
      }
    }
    
    // Re-initialize other charts if top products data exists
    if (chartsData.topProducts && chartsData.topProducts.length > 0) {
      try {
        initializeTopProductsPieChart(isDarkMode, textColor, chartsData.colors, chartsData.topProducts);
      } catch (e) {
        console.warn('⚠️ Top products chart update failed:', e.message);
      }
      
      try {
        initializeTopSalesChart(isDarkMode, textColor, gridColor, chartsData.colors, chartsData.topProducts);
      } catch (e) {
        console.warn('⚠️ Top sales chart update failed:', e.message);
      }
      
      try {
        initializeRevenueChart(isDarkMode, textColor, gridColor, chartsData.colors, chartsData.topProducts);
      } catch (e) {
        console.warn('⚠️ Revenue chart update failed:', e.message);
      }
    }
    
    console.log('✓ Charts update completed');
  } catch (error) {
    console.error('❌ Error updating charts:', error);
  }
}

// ============ PRINT RECEIPT ============

/**
 * Print receipt untuk transaksi
 * @param {Object} transaction - Data transaksi
 * @param {Array} items - Array item transaksi
 * @param {Number} subtotal - Total subtotal
 * @param {Number} discount - Total diskon
 * @param {Number} total - Total pembayaran
 * @param {String} invoiceNumber - Nomor invoice
 */
function printReceipt(transaction, items, subtotal, discount, total, invoiceNumber) {
  try {
    console.log('🖨️  Printing receipt:', invoiceNumber);
    
    // Format tanggal
    const dateObj = new Date(transaction.createdAt || transaction.created_at);
    const date = dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = dateObj.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Buat HTML untuk resi
    const receiptHTML = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resi - ${invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          line-height: 1.4;
          background: #fff;
          padding: 0;
          color: #000;
        }
        
        .receipt {
          max-width: 80mm;
          margin: 0 auto;
          padding: 10mm;
          background: white;
          color: black;
          page-break-after: always;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10mm;
          border-bottom: 2px dashed #000;
          padding-bottom: 5mm;
        }
        
        .header h1 {
          font-size: 18px;
          margin-bottom: 3mm;
          font-weight: bold;
        }
        
        .header p {
          font-size: 11px;
          margin: 1mm 0;
        }
        
        .invoice-info {
          margin-bottom: 8mm;
          font-size: 11px;
          border-bottom: 1px dashed #000;
          padding-bottom: 5mm;
        }
        
        .invoice-info div {
          display: flex;
          justify-content: space-between;
          margin: 2mm 0;
        }
        
        .invoice-info .label {
          flex: 1;
        }
        
        .invoice-info .value {
          flex: 1;
          text-align: right;
          font-weight: bold;
        }
        
        .items-section {
          margin-bottom: 5mm;
          border-bottom: 1px dashed #000;
          padding-bottom: 5mm;
        }
        
        .items-title {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 3mm;
        }
        
        .item {
          font-size: 10px;
          margin: 3mm 0;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 2mm;
        }
        
        .item-name {
          font-weight: bold;
          word-break: break-word;
        }
        
        .item-detail {
          font-size: 9px;
          display: flex;
          justify-content: space-between;
          margin-top: 1mm;
        }
        
        .summary {
          margin-bottom: 5mm;
          font-size: 11px;
          border-bottom: 1px dashed #000;
          padding-bottom: 5mm;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 2mm 0;
        }
        
        .summary-row.subtotal {
          font-weight: normal;
        }
        
        .summary-row.discount {
          color: #dc3545;
          font-weight: bold;
        }
        
        .summary-row.total {
          font-size: 13px;
          font-weight: bold;
          padding: 3mm;
          background: #f5f5f5;
          border: 1px solid #000;
        }
        
        .payment-method {
          font-size: 11px;
          margin: 5mm 0;
          text-align: center;
          padding: 3mm;
          background: #f9f9f9;
        }
        
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 5mm;
          padding-top: 3mm;
          border-top: 1px dashed #000;
        }
        
        .thank-you {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin: 5mm 0;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .receipt {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          <h1>🛒 KASIR</h1>
          <p>Toko Retail Modern</p>
        </div>
        
        <!-- Invoice Info -->
        <div class="invoice-info">
          <div>
            <span class="label">Invoice:</span>
            <span class="value">${invoiceNumber}</span>
          </div>
          <div>
            <span class="label">Tanggal:</span>
            <span class="value">${date}</span>
          </div>
          <div>
            <span class="label">Waktu:</span>
            <span class="value">${time}</span>
          </div>
        </div>
        
        <!-- Items Section -->
        <div class="items-section">
          <div class="items-title">DETAIL PEMBELIAN</div>
          ${items.map((item, idx) => {
            const itemPrice = parseInt(item.price || item.harga) || 0;
            const itemQty = parseInt(item.quantity || item.qty) || 1;
            const itemTotal = itemPrice * itemQty;
            const itemDiscount = item.discount || 0;
            const itemAfterDiscount = itemTotal - itemDiscount;
            
            return `
            <div class="item">
              <div class="item-name">${idx + 1}. ${item.name}</div>
              <div class="item-detail">
                <span>${itemQty}x @ Rp ${formatPrice(itemPrice)}</span>
                <span>Rp ${formatPrice(itemAfterDiscount)}</span>
              </div>
              ${itemDiscount > 0 ? `<div style="font-size: 9px; color: #dc3545;">Diskon: -Rp ${formatPrice(itemDiscount)}</div>` : ''}
            </div>
            `;
          }).join('')}
        </div>
        
        <!-- Summary -->
        <div class="summary">
          <div class="summary-row subtotal">
            <span>Subtotal:</span>
            <span>Rp ${formatPrice(subtotal)}</span>
          </div>
          ${discount > 0 ? `
          <div class="summary-row discount">
            <span>Diskon:</span>
            <span>-Rp ${formatPrice(discount)}</span>
          </div>
          ` : ''}
          <div class="summary-row total">
            <span>TOTAL BAYAR:</span>
            <span>Rp ${formatPrice(total)}</span>
          </div>
        </div>
        
        <!-- Payment Method -->
        <div class="payment-method">
          <strong>Metode Pembayaran:</strong><br>
          ${transaction.paymentMethod || transaction.payment_method || 'Tunai'}
        </div>
        
        <!-- Thank You -->
        <div class="thank-you">Terima Kasih!</div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Semoga menjadi pelanggan setia kami</p>
        </div>
      </div>
      
      <script>
        // Auto print setelah halaman dimuat
        window.addEventListener('load', function() {
          setTimeout(() => {
            window.print();
          }, 500);
        });
      </script>
    </body>
    </html>
    `;
    
    // Buka window print
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    console.log('✓ Receipt printed');
  } catch (error) {
    console.error('❌ Error printing receipt:', error);
    showAlertModal('Error!', 'Gagal mencetak resi: ' + error.message, 'danger');
  }
}

/**
 * Export function untuk global access
 */
window.printReceipt = printReceipt;