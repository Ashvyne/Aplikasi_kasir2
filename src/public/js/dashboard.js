/**
 * DASHBOARD FUNCTIONS
 */

let dashboardRefreshInterval = null;

async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard/summary', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load dashboard data');
    
    const data = await response.json();

    // Update dashboard cards
    document.getElementById('dashboardTransactionsToday').textContent = data.transactions_today || 0;
    document.getElementById('dashboardProfitToday').textContent = formatCurrency(data.profit_today || 0);
    document.getElementById('dashboardTotalProducts').textContent = data.total_products || 0;
    document.getElementById('dashboardEmptyStock').textContent = data.empty_stock_items || 0;
    document.getElementById('dashboardLowStock').textContent = data.low_stock_items || 0;
    document.getElementById('dashboardExpiredItems').textContent = data.expired_items || 0;
    document.getElementById('dashboardExpiringItems').textContent = data.expiring_soon_items || 0;
    document.getElementById('dashboardTotalStock').textContent = data.total_stock || 0;

    // Start auto-refresh if not already running
    if (!dashboardRefreshInterval) {
      dashboardRefreshInterval = setInterval(loadDashboard, 10000); // Refresh every 10 seconds
    }

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showAlert('dashboardAlertContainer', 'Gagal memuat data dashboard', 'danger');
  }
}

/**
 * STOCK IN (BARANG MASUK) FUNCTIONS
 */

async function loadStockInForm() {
  try {
    const response = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load products');
    
    const data = await response.json();
    const products = Array.isArray(data) ? data : (data.products || []);
    const select = document.getElementById('stockinProductSelect');
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Pilih Produk --</option>';
    
    // Add product options
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.sku} - ${product.name}`;
      option.dataset.price = product.buy_price || 0;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error loading stock in form:', error);
  }
}

function updateStockInProductInfo() {
  const select = document.getElementById('stockinProductSelect');
  const selectedOption = select.options[select.selectedIndex];
  
  if (selectedOption.value) {
    // Can show product info here if needed
  }
}

function openStockInModal() {
  loadStockInForm();
  document.getElementById('stockinForm').reset();
}

async function submitStockIn(event) {
  event.preventDefault();

  const productId = document.getElementById('stockinProductSelect').value;
  const quantity = parseInt(document.getElementById('stockinQuantity').value);
  const notes = document.getElementById('stockinNotes').value;

  if (!productId || !quantity) {
    showAlert('stockinAlertContainer', 'Pilih produk dan masukkan jumlah', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/stockin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        product_id: parseInt(productId),
        quantity: quantity,
        notes: notes
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add stock');
    }

    showAlert('stockinAlertContainer', 'Barang masuk berhasil dicatat', 'success');
    document.getElementById('stockinForm').reset();
    loadStockInHistory();

  } catch (error) {
    console.error('Error submitting stock in:', error);
    showAlert('stockinAlertContainer', error.message, 'danger');
  }
}

async function loadStockInHistory() {
  try {
    const response = await fetch('/api/stockin', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load stock in history');
    
    const records = await response.json();
    const tbody = document.getElementById('stockinTableBody');
    tbody.innerHTML = '';

    records.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(record.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
        <td><strong>${record.product.sku}</strong></td>
        <td>${record.product.name}</td>
        <td>${record.quantity}</td>
        <td>${record.notes || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStockIn(${record.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading stock in history:', error);
  }
}

async function deleteStockIn(id) {
  const result = await Swal.fire({
    title: 'Hapus Record?',
    text: 'Yakin ingin menghapus record barang masuk ini?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`/api/stockin/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete stock in');
    
    await Swal.fire({
      title: 'Berhasil!',
      text: 'Record berhasil dihapus',
      icon: 'success',
      timer: 2000
    });
    loadStockInHistory();

  } catch (error) {
    console.error('Error deleting stock in:', error);
    await Swal.fire({
      title: 'Gagal!',
      text: 'Gagal menghapus record',
      icon: 'error'
    });
  }
}

/**
 * STOCK DISPLAY FUNCTIONS
 */

let stockCurrentFilter = 'all';

async function loadStockDisplay() {
  try {
    const response = await fetch('/api/dashboard/stock-report', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load stock report');
    
    window.allStockData = await response.json();
    renderStockTable(window.allStockData);
    updateStockSummary(window.allStockData);

  } catch (error) {
    console.error('Error loading stock display:', error);
    showAlert('stockAlertContainer', 'Gagal memuat data stok', 'danger');
  }
}

function updateStockSummary(products) {
  let normalCount = 0;
  let lowCount = 0;
  let emptyCount = 0;
  let totalStock = 0;

  products.forEach(p => {
    totalStock += p.stock;
    if (p.stock === 0) {
      emptyCount++;
    } else if (p.stock < 10) {
      lowCount++;
    } else {
      normalCount++;
    }
  });

  document.getElementById('stockNormalCount').textContent = normalCount;
  document.getElementById('stockLowCount').textContent = lowCount;
  document.getElementById('stockEmptyCount').textContent = emptyCount;
  document.getElementById('stockTotalCount').textContent = totalStock;
}

function renderStockTable(products) {
  const tbody = document.getElementById('stockTableBody');
  tbody.innerHTML = '';

  products.forEach(product => {
    const row = document.createElement('tr');
    let statusBadge = '';
    
    if (product.stock === 0) {
      statusBadge = '<span class="badge bg-danger">Habis</span>';
    } else if (product.stock < 10) {
      statusBadge = '<span class="badge bg-warning">Kurang</span>';
    } else {
      statusBadge = '<span class="badge bg-success">Normal</span>';
    }

    row.innerHTML = `
      <td><strong>${product.sku}</strong></td>
      <td>${product.name}</td>
      <td>${product.stock}</td>
      <td>${statusBadge}</td>
      <td>${formatCurrency(product.buy_price || 0)}</td>
      <td>${formatCurrency(product.sell_price || 0)}</td>
      <td>${formatCurrency(product.stock_value || 0)}</td>
      <td>${product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('id-ID') : '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

function filterStockStatus(status) {
  stockCurrentFilter = status;
  const filtered = window.allStockData.filter(p => {
    if (status === 'all') return true;
    if (status === 'empty') return p.stock === 0;
    if (status === 'low') return p.stock > 0 && p.stock < 10;
    if (status === 'normal') return p.stock >= 10;
    return true;
  });
  
  renderStockTable(filtered);
}

function searchStock() {
  const search = document.getElementById('stockSearchInput').value.toLowerCase();
  const filtered = window.allStockData.filter(p => 
    p.sku.toLowerCase().includes(search) || 
    p.name.toLowerCase().includes(search)
  );
  
  const byStatus = filtered.filter(p => {
    if (stockCurrentFilter === 'all') return true;
    if (stockCurrentFilter === 'empty') return p.stock === 0;
    if (stockCurrentFilter === 'low') return p.stock > 0 && p.stock < 10;
    if (stockCurrentFilter === 'normal') return p.stock >= 10;
    return true;
  });

  renderStockTable(byStatus);
}

/**
 * UTILITY FUNCTIONS
 */

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function showAlert(containerId, message, type = 'info') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const alertClass = {
    'success': 'alert-success',
    'danger': 'alert-danger',
    'warning': 'alert-warning',
    'info': 'alert-info'
  }[type] || 'alert-info';

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${alertClass} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  container.innerHTML = '';
  container.appendChild(alertDiv);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}
