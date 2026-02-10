// ============ GLOBAL VARIABLES ============
// Menyimpan data produk dari API
let products = [];

// Menyimpan item yang ada di keranjang belanja
let cart = [];

// Menyimpan data transaksi dari API
let transactions = [];

// Menyimpan profit data (hanya tracking, tidak ditampilkan di UI kasir)
let transactionProfit = 0;

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

// ============ AUTO REFRESH SYSTEM ============
// Menyimpan interval IDs untuk auto refresh
let autoRefreshIntervals = {
  dashboard: null,
  products: null,
  transactions: null,
  reports: null,
  stockin: null
};

// ============ ROLE-BASED MENU FILTERING ============
// ✓ NOTE: Role-based filtering is now handled in setupNavigation() function
// This centralized approach ensures consistent and reliable role enforcement

// ============ AUTO REFRESH SYSTEM ============
// Menyimpan interval values (dalam milliseconds)
let autoRefreshSettings = {
  dashboard: 10000,      // 10 detik
  products: 15000,       // 15 detik
  transactions: 10000,   // 10 detik
  reports: 30000,        // 30 detik
  stockin: 15000         // 15 detik
};

// Load saved refresh settings dari localStorage
function loadAutoRefreshSettings() {
  const saved = localStorage.getItem('autoRefreshSettings');
  if (saved) {
    try {
      autoRefreshSettings = { ...autoRefreshSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load saved refresh settings');
    }
  }
}

// Save refresh settings ke localStorage
function saveAutoRefreshSettings() {
  localStorage.setItem('autoRefreshSettings', JSON.stringify(autoRefreshSettings));
}

// Function untuk mengelola auto refresh
function startAutoRefresh(page, loadFunction, interval = null) {
  // Gunakan interval yang diberikan atau ambil dari settings
  const refreshInterval = interval || autoRefreshSettings[page] || 10000;
  
  // Hentikan interval sebelumnya jika ada
  if (autoRefreshIntervals[page]) {
    clearInterval(autoRefreshIntervals[page]);
  }
  
  // Mulai interval baru
  autoRefreshIntervals[page] = setInterval(() => {
    console.log(`🔄 Auto-refreshing ${page}...`);
    loadFunction().catch(e => console.warn(`⚠️ Auto-refresh failed for ${page}:`, e));
  }, refreshInterval);
  
  console.log(`✓ Auto-refresh started for ${page} (interval: ${refreshInterval}ms)`);
  
  // Update UI
  updateAutoRefreshStatus();
}

// Function untuk menghentikan auto refresh
function stopAutoRefresh(page) {
  if (autoRefreshIntervals[page]) {
    clearInterval(autoRefreshIntervals[page]);
    autoRefreshIntervals[page] = null;
    console.log(`⏸️  Auto-refresh stopped for ${page}`);
    updateAutoRefreshStatus();
  }
}

// Function untuk mengupdate interval auto refresh
function updateAutoRefreshInterval(page, newInterval) {
  autoRefreshSettings[page] = newInterval;
  saveAutoRefreshSettings();
  
  // Restart interval jika sedang berjalan
  if (autoRefreshIntervals[page]) {
    // Tentukan function yang tepat
    let loadFunction = loadDashboard;
    if (page === 'products') loadFunction = loadProducts;
    else if (page === 'transactions') loadFunction = loadTransactions;
    else if (page === 'reports') loadFunction = loadReports;
    
    startAutoRefresh(page, loadFunction, newInterval);
  }
}

// Function untuk update status di UI
function updateAutoRefreshStatus() {
  const statusElement = document.getElementById('autoRefreshStatus');
  if (statusElement) {
    const activeRefreshes = Object.entries(autoRefreshIntervals)
      .filter(([_, interval]) => interval !== null)
      .map(([page, _]) => page);
    
    if (activeRefreshes.length > 0) {
      statusElement.innerHTML = `<i class="bi bi-arrow-repeat text-success"></i> Auto-refresh aktif (${activeRefreshes.join(', ')})`;
      statusElement.className = 'badge bg-success';
    } else {
      statusElement.innerHTML = '<i class="bi bi-pause text-muted"></i> Auto-refresh non-aktif';
      statusElement.className = 'badge bg-secondary';
    }
  }
}

// ============ AUTO REFRESH MODAL HANDLERS ============

// Function untuk membuka modal dan load current settings
function openAutoRefreshModal() {
  try {
    // Load current settings dari localStorage ke input fields
    document.getElementById('refreshDashboard').value = autoRefreshSettings.dashboard || 10000;
    document.getElementById('refreshProducts').value = autoRefreshSettings.products || 15000;
    document.getElementById('refreshTransactions').value = autoRefreshSettings.transactions || 10000;
    document.getElementById('refreshReports').value = autoRefreshSettings.reports || 30000;
    document.getElementById('refreshStockIn').value = autoRefreshSettings.stockin || 15000;
    
    console.log('✓ Auto refresh settings loaded in modal');
  } catch (error) {
    console.error('❌ Error opening auto refresh modal:', error);
  }
}

// Function untuk save auto refresh settings
function saveAutoRefreshSettings() {
  try {
    const newSettings = {
      dashboard: parseInt(document.getElementById('refreshDashboard').value) || 10000,
      products: parseInt(document.getElementById('refreshProducts').value) || 15000,
      transactions: parseInt(document.getElementById('refreshTransactions').value) || 10000,
      reports: parseInt(document.getElementById('refreshReports').value) || 30000,
      stockin: parseInt(document.getElementById('refreshStockIn').value) || 15000
    };
    
    // Validasi minimal interval
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] < 5000) {
        newSettings[key] = 5000;
      }
      if (newSettings[key] > 120000) {
        newSettings[key] = 120000;
      }
    });
    
    // Update settings
    autoRefreshSettings = newSettings;
    saveAutoRefreshSettings();
    
    // Restart active intervals dengan setting baru
    Object.keys(autoRefreshIntervals).forEach(page => {
      if (autoRefreshIntervals[page]) {
        let loadFunction = loadDashboard;
        if (page === 'products') loadFunction = loadProducts;
        else if (page === 'transactions') loadFunction = loadTransactions;
        else if (page === 'reports') loadFunction = loadReports;
        else if (page === 'stockin') loadFunction = initStockInPage;
        
        // Restart with new interval
        startAutoRefresh(page, loadFunction, newSettings[page]);
      }
    });
    
    // Tutup modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('autoRefreshModal'));
    if (modal) modal.hide();
    
    // Tampilkan notifikasi sukses
    showAlertModal('✓ Sukses!', 'Pengaturan auto-refresh telah disimpan', 'success');
    console.log('✓ Auto refresh settings saved:', newSettings);
  } catch (error) {
    console.error('❌ Error saving auto refresh settings:', error);
    showAlertModal('❌ Error!', 'Gagal menyimpan pengaturan auto-refresh', 'danger');
  }
}

// Function untuk reset auto refresh settings ke default
function resetAutoRefreshSettings() {
  try {
    // Reset ke default
    autoRefreshSettings = {
      dashboard: 10000,
      products: 15000,
      transactions: 10000,
      reports: 30000,
      stockin: 15000
    };
    
    // Save ke localStorage
    localStorage.setItem('autoRefreshSettings', JSON.stringify(autoRefreshSettings));
    
    // Update input fields
    document.getElementById('refreshDashboard').value = 10000;
    document.getElementById('refreshProducts').value = 15000;
    document.getElementById('refreshTransactions').value = 10000;
    document.getElementById('refreshReports').value = 30000;
    document.getElementById('refreshStockIn').value = 15000;
    
    // Restart active intervals dengan setting default
    Object.keys(autoRefreshIntervals).forEach(page => {
      if (autoRefreshIntervals[page]) {
        let loadFunction = loadDashboard;
        if (page === 'products') loadFunction = loadProducts;
        else if (page === 'transactions') loadFunction = loadTransactions;
        else if (page === 'reports') loadFunction = loadReports;
        else if (page === 'stockin') loadFunction = initStockInPage;
        
        // Restart dengan interval default
        startAutoRefresh(page, loadFunction, autoRefreshSettings[page]);
      }
    });
    
    showAlertModal('✓ Sukses!', 'Pengaturan auto-refresh telah direset ke default', 'success');
    console.log('✓ Auto refresh settings reset to default');
  } catch (error) {
    console.error('❌ Error resetting auto refresh settings:', error);
    showAlertModal('❌ Error!', 'Gagal mereset pengaturan auto-refresh', 'danger');
  }
}

// Function untuk toggle all auto refresh on/off
function toggleAllAutoRefresh() {
  try {
    const hasActiveRefresh = Object.values(autoRefreshIntervals).some(interval => interval !== null);
    
    if (hasActiveRefresh) {
      // Stop all
      Object.keys(autoRefreshIntervals).forEach(page => {
        stopAutoRefresh(page);
      });
      console.log('⏸️  All auto-refresh stopped');
    } else {
      // Start all for current page
      // This will be handled when navigating to a page
      console.log('▶️  Auto-refresh ready to start on next page navigation');
    }
    
    updateAutoRefreshStatus();
  } catch (error) {
    console.error('❌ Error toggling auto refresh:', error);
  }
}

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
  
  // Update charts if they exist
  setTimeout(() => {
    updateChartsForDarkMode();
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
      console.log('✓ User loaded:', userData.username, 'with role:', userData.role);
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
    
    // Initialize dark mode first
    initializeDarkMode();
    
    // Update waktu saat ini
    updateTime();
    
    // Update waktu setiap 1 detik
    setInterval(updateTime, 1000);
    
    // Load saved auto refresh settings
    loadAutoRefreshSettings();
    
    // Setup navigation menu with role-based access control
    setupNavigation();
    
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
    
    // Load semua data dengan error handling
    console.log('📦 Loading initial data...');
    
    // Get user role untuk conditional loading
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role;
    
    // Build load promises sesuai role
    const loadPromises = [];
    
    // Load data based on user role
    const allowedPages = getUserAllowedPages(userRole);
    
    // Load data for allowed pages only
    if (allowedPages.includes('dashboard')) {
      loadPromises.push(loadDashboard().catch(e => console.warn('⚠️ Dashboard load failed:', e)));
    }
    
    if (allowedPages.includes('products') || allowedPages.includes('pos')) {
      loadPromises.push(loadProducts().catch(e => console.warn('⚠️ Products load failed:', e)));
    }
    
    if (allowedPages.includes('transactions') || allowedPages.includes('reports')) {
      loadPromises.push(loadReports().catch(e => console.warn('⚠️ Reports load failed:', e)));
    }
    
    if (allowedPages.includes('transactions')) {
      loadPromises.push(loadTransactions().catch(e => console.warn('⚠️ Transactions load failed:', e)));
    }
    
    Promise.all(loadPromises).then(() => {
      console.log('✓ All allowed data loaded for user role:', userRole);
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

// Role-based page access control
const ROLE_ACCESS_CONTROL = {
  // Item User - Can access inventory management pages
  'item_user': {
    allowed: ['dashboard', 'products', 'stockin', 'stock', 'reports'],
    blocked: ['pos', 'transactions'],
    displayName: 'Staff Barang'
  },
  'admin_barang': { // Legacy role mapping to item_user
    allowed: ['dashboard', 'products', 'stockin', 'stock', 'reports'],
    blocked: ['pos', 'transactions'],
    displayName: 'Staff Barang'
  },
  // Cashier - Can access POS/transaction pages only
  'cashier': {
    allowed: ['pos', 'transactions'],
    blocked: ['dashboard', 'products', 'stockin', 'stock', 'reports'],
    displayName: 'Cashier'
  },
  'admin_kasir': { // Legacy role mapping to cashier
    allowed: ['pos', 'transactions'],
    blocked: ['dashboard', 'products', 'stockin', 'stock', 'reports'],
    displayName: 'Cashier'
  },
  // Borrower role
  'borrower': {
    allowed: ['dashboard', 'reports'],
    blocked: ['products', 'stockin', 'pos', 'transactions'],
    displayName: 'Borrower'
  }
};

// Check if user has access to a specific page
function hasAccessToPage(userRole, pageName) {
  const roleConfig = ROLE_ACCESS_CONTROL[userRole];
  if (!roleConfig) {
    console.warn(`⚠️ Unknown role: ${userRole}`);
    return false;
  }
  return roleConfig.allowed.includes(pageName);
}

// Get user's allowed pages
function getUserAllowedPages(userRole) {
  const roleConfig = ROLE_ACCESS_CONTROL[userRole];
  if (!roleConfig) {
    console.warn(`⚠️ Unknown role: ${userRole}`);
    return [];
  }
  return roleConfig.allowed;
}

// Function untuk setup event listener navigation menu
function setupNavigation() {
  try {
    // Get current user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'admin_barang'; // default to admin_barang
    const roleConfig = ROLE_ACCESS_CONTROL[userRole];
    
    console.log(`👤 User: ${user.username} | Role: ${userRole} | Display: ${roleConfig?.displayName}`);
    
    // ============ ROLE-BASED MENU FILTERING ============
    const allowedPages = getUserAllowedPages(userRole);
    const blockedPages = roleConfig?.blocked || [];
    
    console.log(`✓ Allowed pages for ${roleConfig?.displayName}:`, allowedPages);
    console.log(`❌ Blocked pages for ${roleConfig?.displayName}:`, blockedPages);
    
    // Ambil semua menu item
    const navItems = document.querySelectorAll('.nav-item');
    console.log(`📍 Found ${navItems.length} nav items`);
    
    let visibleNavItems = 0;
    let firstVisibleNav = null;
    
    // Filter menu berdasarkan role
    navItems.forEach(item => {
      const pageName = item.getAttribute('data-page');
      const hasAccess = hasAccessToPage(userRole, pageName);
      
      if (!hasAccess) {
        // Hide menu item yang tidak diizinkan
        item.style.display = 'none';
        item.classList.add('d-none');
        item.classList.remove('d-block');
        console.log(`\n  🚫 BLOCKED for ${roleConfig?.displayName}: ${pageName}`);
      } else {
        // Show menu item yang diizinkan
        item.style.display = '';
        item.classList.remove('d-none');
        item.classList.add('d-block');
        visibleNavItems++;
        if (!firstVisibleNav) {
          firstVisibleNav = item;
        }
        console.log(`\n  ✓ ALLOWED for ${roleConfig?.displayName}: ${pageName}`);
      }
      
      // Add click event ke setiap menu item
      if (!item.__eventListenerAdded) {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const clickedPage = item.getAttribute('data-page');
          
          // Check access permission
          if (!hasAccessToPage(userRole, clickedPage)) {
            console.warn(`❌ Unauthorized access attempt: ${userRole} -> ${clickedPage}`);
            showAccessDeniedModal(clickedPage, userRole);
            return;
          }
          
          console.log(`🔗 Navigating to: ${clickedPage}`);
          navigateTo(clickedPage);
        });
        item.__eventListenerAdded = true;
      }
    });
    
    console.log(`\n📊 Navigation setup: ${visibleNavItems} menu item(s) visible`);
    
    // ============ BROWSER HISTORY SUPPORT ============
    // Handle back/forward button dan page restore
    window.addEventListener('popstate', (event) => {
      console.log('🔙 Popstate detected:', event.state);
      
      if (event.state && event.state.page) {
        if (hasAccessToPage(userRole, event.state.page)) {
          navigateToPage(event.state.page);
        } else {
          console.warn(`⚠️ Popstate tried to navigate to unauthorized page: ${event.state.page}`);
          if (firstVisibleNav) {
            navigateToPage(firstVisibleNav.getAttribute('data-page'));
          }
        }
      }
    });
    
    // Handle initial page load - detect page dari URL
    const currentPath = window.location.pathname;
    
    // Try to load from URL first, fallback to first allowed page
    let initialPage = null;
    for (const allowedPage of allowedPages) {
      if (currentPath.includes(`/${allowedPage}`)) {
        initialPage = allowedPage;
        break;
      }
    }
    
    // If no allowed page found in URL, use first allowed page
    if (!initialPage) {
      initialPage = allowedPages[0] || 'dashboard';
    }
    
    console.log(`📍 Initial page: ${initialPage}`);
    navigateToPage(initialPage);
    
    console.log('✓ Navigation setup complete');
  } catch (error) {
    console.error('❌ Navigation setup error:', error);
  }
}

// Show access denied modal
function showAccessDeniedModal(pageName, userRole) {
  const roleConfig = ROLE_ACCESS_CONTROL[userRole];
  const roleDisplay = roleConfig?.displayName || userRole;
  
  Swal.fire({
    icon: 'error',
    title: '❌ Access Denied',
    html: `
      <div class="text-start">
        <p><strong>You don't have permission to access this page.</strong></p>
        <hr>
        <p class="text-muted mb-2">
          <i class="bi bi-person-fill"></i> <strong>Your Role:</strong> ${roleDisplay}
        </p>
        <p class="text-muted">
          <i class="bi bi-lock-fill"></i> <strong>Trying to access:</strong> ${pageName}
        </p>
        <hr>
        <p class="text-danger"><small>If you need access to this feature, please contact your administrator.</small></p>
      </div>
    `,
    confirmButtonText: 'Understand',
    didOpen: () => {
      console.log(`🚫 Access denied: ${roleDisplay} tried to access ${pageName}`);
    }
  });
}

// Function untuk navigate tanpa push state (gunakan untuk popstate/initial load)
function navigateToPage(pageName) {
  try {
    // Check user role access
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'admin_barang';
    
    // Verify access before showing page
    if (!hasAccessToPage(userRole, pageName)) {
      console.error(`❌ Access Denied: ${userRole} cannot access ${pageName}`);
      showAccessDeniedModal(pageName, userRole);
      return;
    }
    
    console.log(`📄 Navigate to page (no push state): ${pageName}`);
    
    // Sembunyikan semua halaman
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
      page.classList.remove('active');
    });
    
    // Tampilkan halaman yang dipilih
    const page = document.getElementById(`${pageName}-page`);
    if (!page) {
      throw new Error(`Page not found: ${pageName}-page`);
    }
    page.classList.add('active');
    
    // Update class active di navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
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
    
    // ============ AUTO REFRESH MANAGEMENT ============
    // Stop all existing auto refresh intervals
    Object.keys(autoRefreshIntervals).forEach(page => {
      if (autoRefreshIntervals[page]) {
        clearInterval(autoRefreshIntervals[page]);
        autoRefreshIntervals[page] = null;
      }
    });
    
    // Reload data dan mulai auto-refresh sesuai halaman
    if (pageName === 'dashboard') {
      console.log('🔄 Reloading dashboard...');
      loadDashboard().then(() => {
        startAutoRefresh('dashboard', loadDashboard);
      });
    } else {
      if (typeof dashboardRefreshInterval !== 'undefined' && dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
        dashboardRefreshInterval = null;
      }
    }
    
    if (pageName === 'products') {
      console.log('🔄 Reloading products...');
      loadProducts().then(() => {
        startAutoRefresh('products', loadProducts);
      });
    }
    
    if (pageName === 'stockin') {
      console.log('🔄 Reloading stock in...');
      initStockInPage().then(() => {
        startAutoRefresh('stockin', initStockInPage);
      }).catch(e => console.error('Stock in error:', e));
    }
    
    if (pageName === 'stock') {
      console.log('🔄 Reloading stock display...');
      loadProducts().then(() => {
        // Display stock information and update summary
        updateStockSummary();
        startAutoRefresh('products', loadProducts);
      }).catch(e => console.warn('⚠️ Stock load failed:', e));
    }
    
    if (pageName === 'pos') {
      console.log('🔄 Reloading POS products...');
      loadProducts().then(() => {
        displayProducts();
        startAutoRefresh('products', loadProducts);
      });
    }
    
    if (pageName === 'transactions') {
      console.log('🔄 Reloading transactions...');
      loadTransactions().then(() => {
        displayTransactions();
        startAutoRefresh('transactions', loadTransactions);
      });
    }
    
    if (pageName === 'reports') {
      console.log('🔄 Reloading reports...');
      loadReports().then(() => {
        startAutoRefresh('reports', loadReports);
      });
    }
    
    console.log('✓ Page navigation complete');
  } catch (error) {
    console.error('❌ Page navigation error:', error);
  }
}

// Function untuk navigasi ke halaman tertentu (dengan push state)
function navigateTo(pageName) {
  try {
    console.log('📄 Navigate to:', pageName);
    
    // Update URL tanpa reload halaman (SPA navigation)
    const currentUrl = window.location.pathname;
    const newUrl = `/${pageName}`;
    
    if (currentUrl !== newUrl) {
      const titles = {
        dashboard: 'Dashboard',
        products: 'Data Produk',
        stockin: 'Barang Masuk',
        stock: 'Stok Barang',
        pos: 'Kasir',
        transactions: 'Riwayat Transaksi',
        reports: 'Laporan'
      };
      
      window.history.pushState(
        { page: pageName }, 
        titles[pageName] || 'Page',
        newUrl
      );
      console.log('📍 URL updated to:', newUrl);
    }
    
    // Navigate ke page
    navigateToPage(pageName);
    
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
    
    // Clear selection saat reload
    clearProductSelection();
    
    // Ambil token dari localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found');
    }
    
    console.log('📡 Fetching from /api/products');
    console.log('🔐 Token present:', !!token);
    console.log('📏 Token length:', token ? token.length : 0);
    
    // Kirim request GET ke API products
    const response = await fetch('/api/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response statusText:', response.statusText);
    
    // Cek apakah response OK
    if (!response.ok) {
      // Jika 403, kemungkinan token tidak valid
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ message: 'Token tidak valid atau expired' }));
        console.error('🔐 Authorization error:', errorData);
        throw new Error(`Authorization failed: ${errorData.message || response.statusText}`);
      }
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
    
    // Start auto-refresh if not already running
    if (!autoRefreshIntervals.products) {
      startAutoRefresh('products', loadProducts);
    }
  } catch (error) {
    console.error('❌ Error loading products:', error);
    console.error('Error message:', error.message);
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
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #6c757d;"><i class="bi bi-box" style="font-size: 3rem; display: block; margin-bottom: 1rem; opacity: 0.3;"></i><p>Tidak ada produk</p></div>';
      return;
    }
    
    // Loop setiap produk dan buat card dengan desain modern
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = `pos-product-card ${product.stock === 0 ? 'unavailable' : ''}`;
      
      // Tentukan status stok
      const stockStatus = product.stock === 0 ? 'empty' : product.stock < 10 ? 'low' : 'ok';
      
      // Map kategori ke nama
      const categoryMap = {
        '1': 'Makanan',
        '2': 'Minuman',
        '3': 'Snack',
        '4': 'Elektronik',
        '5': 'Lainnya'
      };
      const categoryName = categoryMap[product.category] || 'Produk';
      
      // Buat HTML untuk card modern
      card.innerHTML = `
        <div class="pos-product-image">
          ${product.image_url ? 
            `<img src="${product.image_url}" alt="${escapeHtml(product.name)}" style="width: 100%; height: 100%; object-fit: cover;">` :
            `<div style="width: 100%; height: 100%; background-color: #e9ecef; display: flex; align-items: center; justify-content: center; font-size: 3rem;">📦</div>`
          }
        </div>
        <div class="pos-product-info">
          <div class="pos-product-category">${categoryName}</div>
          <div class="pos-product-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</div>
          <div class="pos-product-sku" style="font-size: 0.75rem; color: #6c757d; margin-bottom: 0.25rem;">SKU: ${escapeHtml(product.sku || 'N/A')}</div>
          <div class="pos-product-price">Rp ${formatPrice(product.sell_price || product.price || 0)}</div>
          <div class="pos-product-stock">Stok: ${product.stock}</div>
          <button class="pos-product-btn" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''} style="${product.stock === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
            <i class="bi bi-plus-lg"></i> Tambah
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

// Function untuk update stock summary di stock page
function updateStockSummary() {
  try {
    console.log('📊 Updating stock summary...');
    
    // Calculate stock statistics
    let normalCount = 0;
    let lowCount = 0;
    let emptyCount = 0;
    let totalStock = 0;
    
    products.forEach(product => {
      const stock = product.stock || 0;
      totalStock += stock;
      
      if (stock === 0) {
        emptyCount++;
      } else if (stock < 10) {
        lowCount++;
      } else {
        normalCount++;
      }
    });
    
    // Update UI
    const elements = {
      stockNormalCount: normalCount,
      stockLowCount: lowCount,
      stockEmptyCount: emptyCount,
      stockTotalCount: totalStock
    };
    
    Object.keys(elements).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = elements[id];
      }
    });
    
    console.log(`✓ Stock summary updated: Normal=${normalCount}, Low=${lowCount}, Empty=${emptyCount}, Total=${totalStock}`);
  } catch (error) {
    console.error('❌ Update stock summary error:', error);
  }
}

// Function untuk filter stock berdasarkan status
function filterStockStatus(status) {
  try {
    console.log('🔍 Filtering stock by status:', status);
    
    // Update active button
    const buttons = document.querySelectorAll('.stock-filter-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-filter') === status) {
        btn.classList.add('active');
      }
    });
    
    // Filter products
    if (status === 'all') {
      // Show all, no filter needed
      displayStockTable(products);
    } else {
      const filteredProducts = products.filter(product => {
        const stock = product.stock || 0;
        if (status === 'empty') return stock === 0;
        if (status === 'low') return stock > 0 && stock < 10;
        if (status === 'normal') return stock >= 10;
        return true;
      });
      displayStockTable(filteredProducts);
    }
    
    console.log('✓ Stock filter applied');
  } catch (error) {
    console.error('❌ Filter stock status error:', error);
  }
}

// Function untuk display stock dalam table format
function displayStockTable(productsToDisplay) {
  try {
    const tbody = document.querySelector('#stock-page table tbody');
    if (!tbody) {
      console.warn('⚠️ Stock table tbody not found');
      return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (productsToDisplay.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Tidak ada produk</td></tr>';
      return;
    }
    
    // Create rows for each product
    productsToDisplay.forEach(product => {
      const stock = product.stock || 0;
      let stockBadge = '';
      
      if (stock === 0) {
        stockBadge = '<span class="badge bg-danger">Habis</span>';
      } else if (stock < 10) {
        stockBadge = '<span class="badge bg-warning text-dark">Kurang</span>';
      } else {
        stockBadge = '<span class="badge bg-success">Normal</span>';
      }
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(product.sku || 'N/A')}</td>
        <td>${escapeHtml(product.name)}</td>
        <td>${stock}</td>
        <td>Rp ${formatPrice(product.sell_price || product.price || 0)}</td>
        <td>${stockBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary" onclick="editProduct(${product.id})">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    console.log(`✓ Stock table displayed with ${productsToDisplay.length} products`);
  } catch (error) {
    console.error('❌ Display stock table error:', error);
  }
}/**
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
        document.getElementById('productPrice').value = product.sell_price || product.price || 0;
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
  const productPriceInput = document.getElementById('productPrice');
  
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
  
  // Format harga ketika user input
  if (productPriceInput) {
    productPriceInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
      }
    });
    
    productPriceInput.addEventListener('blur', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
      }
    });
  }
  
  // Format uang diterima di checkout
  const cashReceivedInput = document.getElementById('cashReceived');
  if (cashReceivedInput) {
    cashReceivedInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
      }
    });
    
    cashReceivedInput.addEventListener('blur', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
      }
    });
    
    cashReceivedInput.addEventListener('change', () => {
      calculateChange();
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
    const productPriceInput = document.getElementById('productPrice').value.replace(/\D/g, '');
    const productPrice = parseInt(productPriceInput) || 0;
    const productStock = parseInt(document.getElementById('productStock').value) || 0;
    const productImageFile = document.getElementById('productImage').files[0];
    
    // Validasi input
    if (!productName) {
      showAlertModal('Error', 'Nama produk harus diisi', 'danger');
      return;
    }
    if (!productSku) {
      showAlertModal('Error', 'SKU harus diisi', 'danger');
      return;
    }
    if (productPrice <= 0) {
      showAlertModal('Error', 'Harga harus lebih dari 0', 'danger');
      return;
    }
    if (productStock < 0) {
      showAlertModal('Error', 'Stok tidak boleh negatif', 'danger');
      return;
    }
    
    // Ambil token
    const token = localStorage.getItem('token');
    if (!token) {
      showAlertModal('Error', 'Token expired, login kembali', 'danger');
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
      
      // Tampilkan alert dengan auto-close 3 detik
      showAlertModal('Berhasil', successMessage, 'success', 3000);
      
      // Tutup modal dan reload data
      setTimeout(() => {
        closeProductModal();
        loadProducts();
        
        // Jika halaman POS (Kasir) sedang aktif, refresh juga halaman itu
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.id === 'pos-page') {
          console.log('🔄 Auto-refreshing POS page because product was saved');
          displayProducts();
        }
      }, 3500);
    } else {
      // Handle error response
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('❌ API Error:', response.status, errorData);
      showAlertModal('Error', errorData.message || 'Gagal menyimpan produk', 'danger');
    }
  } catch (error) {
    console.error('❌ Save product error:', error);
    showAlertModal('Error', 'Terjadi kesalahan: ' + error.message, 'danger');
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
  const headerNoSkuProduk = document.getElementById('headerNoSkuProduk');
  const selectedCount = document.getElementById('selectedCount');
  
  if (selectedProducts.size > 0) {
    // Show toolbar dengan animasi smooth
    toolbar.style.display = 'block';
    setTimeout(() => {
      toolbar.style.opacity = '1';
      toolbar.classList.add('visible');
    }, 10);
    selectedCount.textContent = selectedProducts.size;
    
    // Update row highlights
    document.querySelectorAll('#productsTableBody tr').forEach(row => {
      const checkbox = row.querySelector('.product-checkbox');
      if (checkbox && checkbox.checked) {
        row.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
      } else {
        row.style.backgroundColor = '';
      }
    });
  } else {
    // Hide toolbar dengan animasi smooth
    toolbar.style.opacity = '0';
    toolbar.classList.remove('visible');
    setTimeout(() => {
      toolbar.style.display = 'none';
    }, 300);
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
        showAlertModal('Peringatan!', 'Stok tidak cukup', 'warning');
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
    
    // Update cart item count in header
    const cartItemCount = document.getElementById('cartItemCount');
    if (cartItemCount) {
      cartItemCount.textContent = cart.length;
    }
    
    // Jika keranjang kosong
    if (cart.length === 0) {
      cartDiv.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 2rem 1rem;"><i class="bi bi-bag-x" style="font-size: 2.5rem; display: block; margin-bottom: 1rem; opacity: 0.3;"></i><p style="font-size: 0.9rem;">Keranjang kosong</p></div>';
      return;
    }
    
    // Loop setiap item di keranjang
    cart.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      const itemDiscount = item.discount || 0;
      const itemAfterDiscount = itemSubtotal - itemDiscount;
      
      const cartItem = document.createElement('div');
      cartItem.className = 'pos-cart-item';
      cartItem.innerHTML = `
        <div class="pos-cart-item-info">
          <div class="pos-cart-item-name">${escapeHtml(item.name)}</div>
          <div class="pos-cart-item-price">Rp ${formatPrice(item.price)} × ${item.quantity}</div>
          ${itemDiscount > 0 ? `<div class="pos-cart-item-discount" style="color: #dc3545; font-size: 0.8rem;">Diskon: -Rp ${formatPrice(itemDiscount)}</div>` : ''}
        </div>
        <div class="pos-cart-item-actions">
          <button class="pos-cart-item-add-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" title="Tambah jumlah">
            <i class="bi bi-plus-lg"></i>
          </button>
          <button class="pos-cart-item-discount-btn" onclick="openDiscountModal(${item.id}, ${itemSubtotal})" title="Edit diskon">
            <i class="bi bi-percent"></i>
          </button>
          <button class="pos-cart-item-remove" onclick="removeFromCart(${item.id})" title="Hapus">
            <i class="bi bi-trash"></i>
          </button>
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
    // Ambil nilai diskon transaksi keseluruhan (jika ada)
    const discountElement = document.getElementById('discount');
    const transactionDiscount = (discountElement) ? (parseInt(discountElement.value) || 0) : 0;
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
    const totalBeforeTax = Math.max(0, subtotal - totalDiscount);
    
    // Hitung pajak (PPN 10%)
    const tax = Math.round(totalBeforeTax * 0.1);
    const total = totalBeforeTax + tax;
    
    // Update elemen DOM
    document.getElementById('subtotal').textContent = 'Rp ' + formatPrice(subtotal);
    document.getElementById('taxAmount').textContent = 'Rp ' + formatPrice(tax);
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
    const receivedInput = document.getElementById('cashReceived').value.replace(/\D/g, '');
    const received = parseInt(receivedInput) || 0;
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
  const discountElement = document.getElementById('discount');
  const transactionDiscount = (discountElement) ? (parseInt(discountElement.value) || 0) : 0;
  let subtotal = 0;
  let totalItemDiscounts = 0;
  
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    totalItemDiscounts += (item.discount || 0);
  });
  
  const totalDiscount = totalItemDiscounts + transactionDiscount;
  const totalBeforeTax = Math.max(0, subtotal - totalDiscount);
  const tax = Math.round(totalBeforeTax * 0.1);
  return totalBeforeTax + tax;
}

// Function untuk buka history transaksi
function openTransactionHistory() {
  try {
    // Navigate to transactions page
    showPage('transactions');
  } catch (error) {
    console.error('❌ Open transaction history error:', error);
  }
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
      const cashReceivedElement = document.getElementById('cashReceived');
      if (cashReceivedElement) cashReceivedElement.value = '';
      const changeAmountElement = document.getElementById('changeAmount');
      if (changeAmountElement) changeAmountElement.textContent = 'Rp 0';
      console.log('✓ Cart cleared');
    }
  });
}

// Function untuk buka discount modal per item
function openDiscountModal(productId, itemTotal) {
  try {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    Swal.fire({
      title: `Diskon - ${item.name}`,
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 1rem;"><strong>Subtotal:</strong> Rp ${formatPrice(itemTotal)}</p>
          <div style="margin-bottom: 1.5rem;">
            <label for="discountAmount" style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Diskon (Rp):</label>
            <input type="number" id="discountAmount" class="form-control" value="${item.discount || 0}" min="0" max="${itemTotal}" step="1000" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px;" />
          </div>
          <div>
            <label for="discountPercent" style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Atau Diskon (%):</label>
            <input type="number" id="discountPercent" class="form-control" value="${item.discount_percent || 0}" min="0" max="100" step="1" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px;" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Terapkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#212529',
      didOpen: () => {
        const amountInput = document.getElementById('discountAmount');
        const percentInput = document.getElementById('discountPercent');
        
        // Ketika user input persentase, konversi ke rupiah
        percentInput.addEventListener('change', () => {
          const percent = parseInt(percentInput.value) || 0;
          if (percent > 0 && percent <= 100) {
            const amount = Math.round((itemTotal * percent) / 100);
            amountInput.value = amount;
          } else if (percent === 0) {
            amountInput.value = 0;
          }
        });
        
        // Ketika user input rupiah, konversi ke persentase
        amountInput.addEventListener('change', () => {
          const amount = parseInt(amountInput.value) || 0;
          if (amount > 0 && amount <= itemTotal) {
            const percent = Math.round((amount / itemTotal) * 100);
            percentInput.value = percent;
          } else if (amount === 0) {
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
          Swal.fire('Peringatan', 'Diskon tidak boleh melebihi total item', 'warning');
          return;
        }
        
        // Simpan diskon ke item
        item.discount = Math.max(0, finalAmount);
        item.discount_percent = Math.max(0, finalPercent);
        
        // Update tampilan
        displayCart();
        updateTotal();
        console.log(`✓ Diskon diterapkan ke ${item.name}: Rp ${formatPrice(item.discount)}`);
      }
    });
  } catch (error) {
    console.error('❌ Discount modal error:', error);
  }
}

// Function untuk edit diskon per item
function editItemDiscount(productId) {
  try {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    const itemTotal = item.price * item.quantity;
    openDiscountModal(productId, itemTotal);
  } catch (error) {
    console.error('❌ Edit item discount error:', error);
  }
}

/**
 * ============ PROFIT CALCULATION SYSTEM ============
 * 
 * Struktur Data Profit:
 * - Harga Awal (Modal) = buy_price dari database
 * - Harga Jual = sell_price dari database
 * - Rumus Profit = (Harga Jual - Harga Awal) × Qty
 * 
 * Contoh Perhitungan:
 * Produk: Coba asjah
 * - Buy Price (Modal): Rp 60.000
 * - Sell Price: Rp 100.000
 * - Quantity: 4
 * - Profit per item: Rp 100.000 - Rp 60.000 = Rp 40.000
 * - Total Profit: Rp 40.000 × 4 = Rp 160.000
 * 
 * Produk: Es Teh Manis
 * - Buy Price (Modal): Rp 6.000
 * - Sell Price: Rp 10.000
 * - Quantity: 9
 * - Profit per item: Rp 10.000 - Rp 6.000 = Rp 4.000
 * - Total Profit: Rp 4.000 × 9 = Rp 36.000
 * 
 * Total Profit Transaksi = Rp 160.000 + Rp 36.000 = Rp 196.000
 */

// Function untuk hitung profit per item
function calculateItemProfit(item) {
  try {
    // Cari produk di database untuk mendapat buy_price
    const product = products.find(p => p.id === item.id);
    if (!product) {
      console.warn(`⚠️ Produk ${item.id} tidak ditemukan`);
      return 0;
    }
    
    const buyPrice = product.buy_price || 0;
    const sellPrice = item.price || 0;
    const profitPerUnit = Math.max(0, sellPrice - buyPrice);
    const totalProfit = profitPerUnit * item.quantity;
    
    return totalProfit;
  } catch (error) {
    console.error('❌ Profit calculation error:', error);
    return 0;
  }
}

// Function untuk hitung total profit transaksi
function calculateTotalProfit() {
  try {
    let totalProfit = 0;
    
    cart.forEach(item => {
      const itemProfit = calculateItemProfit(item);
      totalProfit += itemProfit;
    });
    
    transactionProfit = totalProfit;
    console.log(`💰 Total Transaction Profit: Rp ${formatPrice(totalProfit)}`);
    return totalProfit;
  } catch (error) {
    console.error('❌ Total profit calculation error:', error);
    return 0;
  }
}

// Function untuk log profit details (hanya untuk backend/analytics)
function logProfitDetails() {
  try {
    console.log('📊 ===== PROFIT DETAILS =====');
    
    cart.forEach((item, index) => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        const buyPrice = product.buy_price || 0;
        const sellPrice = item.price || 0;
        const profitPerUnit = Math.max(0, sellPrice - buyPrice);
        const totalProfit = profitPerUnit * item.quantity;
        
        console.log(`${index + 1}. ${item.name}`);
        console.log(`   Buy Price: Rp ${formatPrice(buyPrice)}`);
        console.log(`   Sell Price: Rp ${formatPrice(sellPrice)}`);
        console.log(`   Quantity: ${item.quantity}`);
        console.log(`   Profit per Unit: Rp ${formatPrice(profitPerUnit)}`);
        console.log(`   Total Profit: Rp ${formatPrice(totalProfit)}`);
      }
    });
    
    console.log(`💰 Transaction Profit: Rp ${formatPrice(transactionProfit)}`);
    console.log('========================');
  } catch (error) {
    console.error('❌ Error logging profit details:', error);
  }
}

// Function untuk checkout/selesaikan transaksi
async function checkoutTransaction() {
  try {
    // Cek apakah keranjang ada isi
    if (cart.length === 0) {
      Swal.fire('Gagal!', 'Keranjang masih kosong', 'error');
      return;
    }
    
    // Get cash received value
    const cashReceivedElement = document.getElementById('cashReceived');
    const receivedInput = (cashReceivedElement?.value || '0').replace(/\D/g, '');
    const received = parseInt(receivedInput) || 0;
    
    const total = getTotalAmount();
    
    // Validasi pembayaran
    if (received < total) {
      Swal.fire('Peringatan!', 'Uang diterima tidak cukup', 'warning');
      return;
    }
    
    // Calculate profit for this transaction
    calculateTotalProfit();
    logProfitDetails();
    
    // Buat object transaksi
    const change = Math.max(0, received - total);
    const transactionData = {
      items: cart,
      total: total,
      paymentMethod: 'Tunai', // Default to cash since new design only has cash payment
      discount: 0,
      cash_received: received,
      change_amount: change,
      profit: transactionProfit // Include profit in transaction data for backend processing
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
      
      // Tampilkan success alert dengan countdown auto-close
      let countdownSeconds = 5;
      Swal.fire({
        title: 'Transaksi Berhasil! 🎉',
        html: `
          <div style="text-align: left;">
            <div style="margin-bottom: 12px;">
              <strong>No. Invoice:</strong> ${data.invoiceNumber}<br>
              <strong>Total:</strong> Rp ${formatPrice(total)}<br>
              <strong>Stok:</strong> ${stockMessage}
            </div>
            <div id="countdownTimer" style="margin-top: 20px; padding: 12px; background-color: #e8f5e9; border-radius: 6px; font-weight: 600; color: #2e7d32;">
              ⏱️ Ditutup otomatis dalam <span id="countdown">${countdownSeconds}</span> detik
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#28a745',
        confirmButtonText: '✓ OK',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          // Countdown timer
          const countdownInterval = setInterval(() => {
            countdownSeconds--;
            const countdownEl = document.getElementById('countdown');
            if (countdownEl) {
              countdownEl.textContent = countdownSeconds;
            }
            
            if (countdownSeconds <= 0) {
              clearInterval(countdownInterval);
              Swal.close();
            }
          }, 1000);
        }
      }).then(() => {
        // Clear keranjang
        cart = [];
        displayCart();
        updateTotal();
        const cashReceivedElement = document.getElementById('cashReceived');
        if (cashReceivedElement) {
          cashReceivedElement.value = '';
        }
        const changeAmountElement = document.getElementById('changeAmount');
        if (changeAmountElement) {
          changeAmountElement.textContent = 'Rp 0';
        }
        
        // Reload semua data
        loadProducts();
        // Only reload transactions untuk admin_kasir
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.role === 'admin_kasir') {
          loadTransactions();
        }
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
    // Get user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role;
    
    // Check role - hanya admin_kasir yang bisa akses
    if (userRole !== 'admin_kasir') {
      console.log('⚠️ User role is not admin_kasir, skipping transactions load');
      return;
    }
    
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
      
      // Start auto-refresh if not already running
      if (!autoRefreshIntervals.transactions) {
        startAutoRefresh('transactions', loadTransactions);
      }
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
      const cashReceived = parseInt(trans.cash_received || 0) || 0;
      const changeAmount = parseInt(trans.change_amount || 0) || 0;
      
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
              ${cashReceived > 0 ? `
              <div class="calc-row" style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; margin-top: 12px;">
                <span>Uang Diterima:</span>
                <span>Rp ${formatPrice(cashReceived)}</span>
              </div>
              <div class="calc-row" style="display: flex; justify-content: space-between; font-size: 14px; padding: 8px; background-color: #d4edda; border-radius: 4px; border: 1px solid #c3e6cb;">
                <span style="color: #155724;">Kembalian:</span>
                <span style="color: #155724; font-weight: bold;">Rp ${formatPrice(changeAmount)}</span>
              </div>
              ` : ''}
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
          printButton.className = 'btn btn-success me-2';
          printButton.style.cssText = 'padding: 6px 12px; margin-right: 8px; font-size: 14px; cursor: pointer;';
          printButton.innerHTML = '<i class="bi bi-printer me-1"></i> Cetak Resi';
          printButton.onclick = () => printReceipt(trans, items, subtotal, discount, total, invoiceNumber, cashReceived, changeAmount);
          
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

            // Reload transactions - only untuk admin_kasir
            const delUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (delUser.role === 'admin_kasir') {
              await loadTransactions();
            }

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

// Function untuk handle barcode/SKU entry dengan Enter key
// Barcode scanner menekan Enter setelah mengirim barcode
function handleBarcodeEntry(event) {
  try {
    // Jika user menekan Enter
    if (event.key === 'Enter') {
      event.preventDefault();
      
      const searchInput = document.getElementById('searchProduct');
      const barcode = searchInput.value.trim();
      
      if (!barcode) {
        return;
      }
      
      // Cari produk berdasarkan SKU (barcode)
      // SKU biasanya unik, jadi cari yang cocok dengan SKU
      const product = products.find(p => 
        p.sku && p.sku.toLowerCase() === barcode.toLowerCase()
      );
      
      if (product) {
        // Produk ditemukan, tambahkan ke keranjang
        addToCart(product.id);
        
        // Tampilkan notifikasi sukses
        showAlertModal('Sukses!', `${product.name} ditambahkan ke keranjang`, 'success');
        
        // Clear search input untuk siap scan produk berikutnya
        searchInput.value = '';
        
        // Kembalikan fokus ke search input
        searchInput.focus();
        
        console.log(`✓ Barcode ditemukan dan ditambahkan: ${barcode}`);
      } else {
        // Produk tidak ditemukan
        showAlertModal('Gagal!', `Produk dengan barcode/SKU "${barcode}" tidak ditemukan`, 'danger');
        
        // Highlight search input untuk menunjukkan error
        searchInput.style.borderColor = '#dc3545';
        setTimeout(() => {
          searchInput.style.borderColor = '#dee2e6';
        }, 2000);
        
        console.warn(`✗ Barcode tidak ditemukan: ${barcode}`);
      }
    }
  } catch (error) {
    console.error('❌ Barcode entry error:', error);
    showAlertModal('Error!', 'Terjadi kesalahan saat memproses barcode', 'danger');
  }
}

// Function untuk search/filter produk di POS (product cards)
function searchProducts() {
  try {
    const keyword = document.getElementById('searchProduct').value.toLowerCase();
    const cards = document.querySelectorAll('.pos-product-card');
    
    cards.forEach(card => {
      const name = card.querySelector('.pos-product-name')?.textContent.toLowerCase() || '';
      const sku = card.querySelector('.pos-product-sku')?.textContent.toLowerCase() || '';
      // Search by both name and SKU
      const matches = name.includes(keyword) || sku.includes(keyword);
      card.style.display = matches ? 'block' : 'none';
    });
  } catch (error) {
    console.error('❌ Search error:', error);
  }
}

// Function untuk filter produk berdasarkan kategori di POS
function filterByCategory(category) {
  try {
    // Update button active state
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-category') === category) {
        btn.classList.add('active');
      }
    });
    
    // Filter cards based on category
    const cards = document.querySelectorAll('.pos-product-card');
    cards.forEach(card => {
      const cardCategory = card.querySelector('.pos-product-category')?.textContent.trim() || '';
      
      if (category === 'all') {
        card.style.display = 'block';
      } else {
        card.style.display = cardCategory === category ? 'block' : 'none';
      }
    });
    
    console.log(`✓ Filtered by category: ${category}`);
  } catch (error) {
    console.error('❌ Filter category error:', error);
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

// Function untuk logout user (hanya logout session device ini, bukan semua)
function logout() {
  Swal.fire({
    title: 'Keluar dari Aplikasi?',
    text: 'Anda akan logout dari device ini. Device lain tetap login.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('sessionId');
        
        // Send logout request ke server untuk tandai session ini sebagai inactive
        if (token && sessionId) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
          }).catch(err => console.warn('Logout API error (non-critical):', err));
        }
        
        // Clear local storage untuk device ini saja
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        localStorage.removeItem('deviceRole');
        
        console.log('✓ User logged out from this device');
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout error:', error);
        // Tetap logout meski ada error
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        localStorage.removeItem('deviceRole');
        window.location.href = '/login';
      }
    }
  });
}

// ============ AUTO REFRESH SETTINGS MODAL ============

// Function untuk menampilkan current settings di modal
function openAutoRefreshModal() {
  document.getElementById('refreshDashboard').value = autoRefreshSettings.dashboard;
  document.getElementById('refreshProducts').value = autoRefreshSettings.products;
  document.getElementById('refreshTransactions').value = autoRefreshSettings.transactions;
  document.getElementById('refreshReports').value = autoRefreshSettings.reports;
  document.getElementById('refreshStockIn').value = autoRefreshSettings.stockin;
}

// Function untuk menyimpan auto refresh settings
function saveAutoRefreshSettings() {
  try {
    // Ambil nilai dari input fields
    const dashboard = parseInt(document.getElementById('refreshDashboard').value);
    const products = parseInt(document.getElementById('refreshProducts').value);
    const transactions = parseInt(document.getElementById('refreshTransactions').value);
    const reports = parseInt(document.getElementById('refreshReports').value);
    const stockin = parseInt(document.getElementById('refreshStockIn').value);
    
    // Validasi nilai (minimum 5 detik = 5000ms)
    if (dashboard < 5000 || products < 5000 || transactions < 5000 || reports < 5000 || stockin < 5000) {
      showAlertModal('⚠️ Peringatan', 'Interval minimum adalah 5 detik (5000 ms)', 'warning');
      return;
    }
    
    // Update global settings
    autoRefreshSettings = {
      dashboard,
      products,
      transactions,
      reports,
      stockin
    };
    
    // Simpan ke localStorage
    try {
      localStorage.setItem('autoRefreshSettings', JSON.stringify(autoRefreshSettings));
    } catch (storageError) {
      console.error('⚠️ LocalStorage save error:', storageError);
    }
    
    // Restart auto refresh dengan settings baru (jika sudah berjalan)
    if (autoRefreshIntervals.dashboard) startAutoRefresh('dashboard', loadDashboard, dashboard);
    if (autoRefreshIntervals.products) startAutoRefresh('products', loadProducts, products);
    if (autoRefreshIntervals.transactions) startAutoRefresh('transactions', loadTransactions, transactions);
    if (autoRefreshIntervals.reports) startAutoRefresh('reports', loadReports, reports);
    
    // Tutup modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('autoRefreshModal'));
    if (modal) modal.hide();
    
    showAlertModal('✓ Berhasil', 'Pengaturan auto refresh telah diperbarui', 'success');
  } catch (error) {
    console.error('❌ Error saving auto refresh settings:', error);
    showAlertModal('❌ Error', 'Gagal menyimpan pengaturan auto refresh', 'danger');
  }
}

// Function untuk reset auto refresh settings ke default
function resetAutoRefreshSettings() {
  autoRefreshSettings = {
    dashboard: 10000,
    products: 15000,
    transactions: 10000,
    reports: 30000,
    stockin: 15000
  };
  
  saveAutoRefreshSettings();
  
  // Update form inputs
  document.getElementById('refreshDashboard').value = 10000;
  document.getElementById('refreshProducts').value = 15000;
  document.getElementById('refreshTransactions').value = 10000;
  document.getElementById('refreshReports').value = 30000;
  document.getElementById('refreshStockIn').value = 15000;
  
  showAlertModal('✓ Reset', 'Pengaturan auto refresh telah direset ke default', 'success');
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
    // Get user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role;
    
    // Check role - hanya admin_barang yang bisa akses
    if (userRole !== 'admin_barang') {
      console.log('⚠️ User role is not admin_barang, skipping reports load');
      return;
    }
    
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
      
      // Start auto-refresh if not already running
      if (!autoRefreshIntervals.reports) {
        startAutoRefresh('reports', loadReports);
      }
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
  if (!chartsData || !chartsData.dailyData) {
    console.warn('⚠️ Chart data not available for update');
    return;
  }
  
  // Get new theme colors
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDarkMode ? '#a0aec0' : '#6b7280';
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
  
  console.log('🎨 Theme colors updated:', { isDarkMode, textColor, gridColor });
  
  try {
    // Re-initialize all charts with new colors
    initializeDailyRevenueChart(isDarkMode, textColor, gridColor, chartsData.dailyData);
    
    if (chartsData.topProducts && chartsData.topProducts.length > 0) {
      initializeTopProductsPieChart(isDarkMode, textColor, chartsData.colors, chartsData.topProducts);
      initializeTopSalesChart(isDarkMode, textColor, gridColor, chartsData.colors, chartsData.topProducts);
      initializeRevenueChart(isDarkMode, textColor, gridColor, chartsData.colors, chartsData.topProducts);
    }
    
    console.log('✓ Charts updated successfully');
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
function printReceipt(transaction, items, subtotal, discount, total, invoiceNumber, cashReceived = 0, changeAmount = 0) {
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
          ${cashReceived > 0 ? `
          <div class="summary-row" style="margin-top: 3mm; padding-top: 3mm; border-top: 1px dotted #000;">
            <span>Uang Diterima:</span>
            <span>Rp ${formatPrice(cashReceived)}</span>
          </div>
          <div class="summary-row" style="font-weight: bold; color: #28a745;">
            <span>Kembalian:</span>
            <span>Rp ${formatPrice(changeAmount)}</span>
          </div>
          ` : ''}
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