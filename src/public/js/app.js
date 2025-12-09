let cart = [];
let currentEditingProductId = null;

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  console.log('✓ DOM Content Loaded');
  
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (document.getElementById('userDisplay')) {
    document.getElementById('userDisplay').textContent = user.username || 'User';
  }
  
  // Setup clock
  updateClock();
  setInterval(updateClock, 1000);
  
  // Setup nav click handlers
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      showPage(page);
    });
  });
  
  // Load data
  loadProducts();
  loadProductsTable();
  loadTransactions();
  loadDashboard();
  
  console.log('✓ App initialized');
});

// ===== PAGE NAVIGATION =====
function showPage(pageName) {
  console.log('🔄 Show page:', pageName);
  
  // Hide all
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Show selected
  const page = document.getElementById(`${pageName}-page`);
  if (page) page.classList.add('active');
  
  const nav = document.querySelector(`[data-page="${pageName}"]`);
  if (nav) nav.classList.add('active');
  
  // Update title
  const titles = {
    pos: '🛒 Point of Sale',
    products: '📦 Manajemen Produk',
    transactions: '📋 Riwayat Transaksi',
    reports: '📊 Laporan'
  };
  document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
}

// ===== API CALL =====
async function apiCall(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  };
  if (data) options.body = JSON.stringify(data);
  
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    return res.ok ? await res.json() : null;
  } catch (e) {
    console.error('API Error:', e);
    return null;
  }
}

// ===== UTILITIES =====
function updateClock() {
  const el = document.getElementById('currentTime');
  if (el) el.textContent = new Date().toLocaleString('id-ID');
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function logout() {
  if (confirm('Logout?')) {
    localStorage.clear();
    window.location.href = '/login';
  }
}

// ===== PRODUK =====
function loadProducts() {
  apiCall('/api/products').then(data => {
    if (!data) return;
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    data.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="name">${p.name}</div>
        <div class="price">${formatRupiah(p.price)}</div>
        <div class="stock">Stok: ${p.stock}</div>
        <button class="btn-add" onclick="addToCart(${p.id}, ${p.price}, '${p.name}', ${p.stock})" 
          ${p.stock <= 0 ? 'disabled style="opacity:0.5"' : ''}>
          ${p.stock <= 0 ? '❌ Habis' : '+ Keranjang'}
        </button>
      `;
      grid.appendChild(card);
    });
  });
}

function loadProductsTable() {
  apiCall('/api/products').then(data => {
    if (!data) return;
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach((p, i) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${i+1}</td><td>${p.name}</td><td>${p.sku}</td><td>${p.category_name}</td>
        <td>${formatRupiah(p.price)}</td><td>${p.stock}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Hapus</button></td>
      `;
    });
  });
}

function openProductModal() {
  document.getElementById('productName').value = '';
  document.getElementById('productSku').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productStock').value = '';
  document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('show');
}

function saveProduct(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('productName').value,
    sku: document.getElementById('productSku').value,
    category_id: parseInt(document.getElementById('productCategory').value),
    price: parseInt(document.getElementById('productPrice').value),
    stock: parseInt(document.getElementById('productStock').value)
  };
  apiCall('/api/products', 'POST', data).then(r => {
    if (r) {
      alert('✓ Produk ditambahkan');
      closeProductModal();
      loadProducts();
      loadProductsTable();
    }
  });
}

function deleteProduct(id) {
  if (!confirm('Hapus?')) return;
  apiCall(`/api/products/${id}`, 'DELETE').then(r => {
    if (r) {
      loadProducts();
      loadProductsTable();
    }
  });
}

function searchProducts() {
  const q = document.getElementById('searchProduct').value.toLowerCase();
  document.querySelectorAll('.product-card').forEach(c => {
    const name = c.querySelector('.name').textContent.toLowerCase();
    c.style.display = name.includes(q) ? 'block' : 'none';
  });
}

// ===== CART =====
function addToCart(id, price, name, stock) {
  if (stock <= 0) { alert('Stok habis'); return; }
  const exist = cart.find(i => i.id === id);
  if (exist) exist.quantity++;
  else cart.push({id, name, price, quantity: 1, stock});
  updateCart();
}

function updateCart() {
  const container = document.getElementById('cartItems');
  if (!container) return;
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:20px">Kosong</p>';
  } else {
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div><strong>${item.name}</strong><br>${formatRupiah(item.price)}</div>
        <div style="display:flex;gap:5px;align-items:center">
          <button onclick="decreaseQty(${item.id})">-</button>
          <span>${item.quantity}</span>
          <button onclick="increaseQty(${item.id})">+</button>
          <button onclick="removeFromCart(${item.id})" style="background:#e74c3c;color:white;border:0;padding:3px 8px">✕</button>
        </div>
      `;
      container.appendChild(div);
    });
  }
  updateTotal();
}

function increaseQty(id) {
  const item = cart.find(i => i.id === id);
  if (item && item.quantity < item.stock) item.quantity++;
  updateCart();
}

function decreaseQty(id) {
  const item = cart.find(i => i.id === id);
  if (item && item.quantity > 1) item.quantity--;
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
}

function updateTotal() {
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const discount = parseInt(document.getElementById('discount').value) || 0;
  const total = subtotal - discount;
  document.getElementById('subtotal').textContent = formatRupiah(subtotal);
  document.getElementById('total').textContent = formatRupiah(total);
}

function calculateChange() {
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const discount = parseInt(document.getElementById('discount').value) || 0;
  const total = subtotal - discount;
  const received = parseInt(document.getElementById('cashReceived').value) || 0;
  const change = received - total;
  document.getElementById('changeAmount').textContent = received > 0 ? formatRupiah(change) : 'Rp 0';
}

function clearCart() {
  if (confirm('Batalkan?')) {
    cart = [];
    updateCart();
    document.getElementById('cashReceived').value = '';
    document.getElementById('changeAmount').textContent = 'Rp 0';
    document.getElementById('discount').value = '0';
  }
}

function checkoutTransaction() {
  if (cart.length === 0) { alert('Keranjang kosong'); return; }
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const discount = parseInt(document.getElementById('discount').value) || 0;
  const total = subtotal - discount;
  const received = parseInt(document.getElementById('cashReceived').value) || 0;
  
  if (received < total) { alert('Uang kurang'); return; }
  
  const data = {
    payment_method: 'cash',
    total_amount: total,
    cash_received: received,
    change_amount: received - total,
    items: cart.map(i => ({product_id: i.id, quantity: i.quantity, subtotal: i.price * i.quantity}))
  };
  
  apiCall('/api/transactions', 'POST', data).then(r => {
    if (r) {
      alert(`✓ Transaksi berhasil\nNo: ${r.invoice_number}\nTotal: ${formatRupiah(r.total_amount)}\nKembalian: ${formatRupiah(r.change_amount)}`);
      cart = [];
      updateCart();
      document.getElementById('cashReceived').value = '';
      document.getElementById('discount').value = '0';
      loadProducts();
      loadProductsTable();
      loadTransactions();
    }
  });
}

// ===== TRANSAKSI =====
function loadTransactions() {
  apiCall('/api/transactions').then(data => {
    if (!data) return;
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach(t => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${t.invoice_number}</td>
        <td>${new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
        <td>${formatRupiah(t.total_amount)}</td>
        <td>${t.payment_method}</td>
        <td><button class="btn btn-sm btn-primary" onclick="printStruk(${t.id})">Print</button></td>
      `;
    });
  });
}

function printStruk(id) {
  window.open(`/api/exports/struk/${id}`, '_blank');
}

// ===== LAPORAN =====
function loadDashboard() {
  apiCall('/api/reports/dashboard').then(data => {
    if (!data) return;
    document.getElementById('todayTransactions').textContent = data.today_transactions || 0;
    document.getElementById('todayRevenue').textContent = formatRupiah(data.today_revenue || 0);
    document.getElementById('weekTransactions').textContent = data.week_transactions || 0;
    document.getElementById('lowStockCount').textContent = data.low_stock_count || 0;
  });
  
  apiCall('/api/reports/top-products').then(data => {
    if (!data) return;
    const tbody = document.getElementById('topProductsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach((p, i) => {
      const row = tbody.insertRow();
      row.innerHTML = `<td>${i+1}</td><td>${p.name}</td><td>${p.total_qty}</td><td>${formatRupiah(p.total_revenue)}</td>`;
    });
  });
}

function exportSalesExcel() {
  window.location.href = '/api/exports/sales-excel';
}

function exportProductsExcel() {
  window.location.href = '/api/exports/products-excel';
}