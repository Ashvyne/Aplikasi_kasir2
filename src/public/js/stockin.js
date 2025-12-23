/**
 * STOCK IN (BARANG MASUK) MODULE
 * 
 * Mengelola fitur barang masuk untuk update stok produk
 * 
 * Features:
 * ✅ Tambah barang masuk
 * ✅ Lihat riwayat barang masuk
 * ✅ Hapus barang masuk
 * ✅ Update stok otomatis
 * ✅ Validasi produk dan jumlah
 */

// Global stock in records
let stockInRecords = [];
let currentStockInPage = 'stockin';

/**
 * Initialize stock in page
 */
async function initStockInPage() {
  console.log('Initializing Stock In page...');
  
  try {
    // Load products for dropdown
    await loadStockInProducts();
    
    // Load stock in history
    await loadStockInHistory();
    
    console.log('✓ Stock In page initialized');
  } catch (error) {
    console.error('❌ Error initializing stock in page:', error);
  }
}

/**
 * Load products untuk dropdown barang masuk
 */
async function loadStockInProducts() {
  try {
    const response = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load products');
    }
    
    const data = await response.json();
    const products = Array.isArray(data) ? data : (data.products || []);
    
    const select = document.getElementById('stockinProductSelect');
    select.innerHTML = '<option value="">-- Pilih Produk --</option>';
    
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.name} (SKU: ${product.sku}) - Stok: ${product.stock || 0}`;
      select.appendChild(option);
    });
    
    console.log('✓ Stock in products loaded:', products.length);
  } catch (error) {
    console.error('❌ Error loading stock in products:', error);
    showAlertModal('Error!', 'Gagal memuat data produk', 'danger');
  }
}

/**
 * Update product info ketika produk dipilih
 */
function updateStockInProductInfo() {
  try {
    const productId = document.getElementById('stockinProductSelect').value;
    if (!productId || !products) return;
    
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    // Ini bisa digunakan untuk menampilkan info harga, dll
    console.log('Selected product:', product);
  } catch (error) {
    console.error('❌ Error updating stock in product info:', error);
  }
}

/**
 * Load stock in history
 */
async function loadStockInHistory() {
  try {
    const response = await fetch('/api/stockin', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load stock in history');
    }
    
    const data = await response.json();
    console.log('✓ Stock in API response:', data);
    
    // Handle berbagai format response
    stockInRecords = Array.isArray(data) ? data : (data.records || data.data || data || []);
    
    console.log('📦 Stock in records loaded:', stockInRecords.length);
    console.log('Sample record:', stockInRecords[0]);
    
    displayStockInHistory();
  } catch (error) {
    console.error('❌ Error loading stock in history:', error);
    showAlertModal('Error!', 'Gagal memuat riwayat barang masuk', 'danger');
  }
}

/**
 * Display stock in history di table
 */
function displayStockInHistory() {
  try {
    const tableBody = document.getElementById('stockinTableBody');
    tableBody.innerHTML = '';
    
    if (!stockInRecords || stockInRecords.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            <i class="bi bi-inbox"></i> Belum ada data barang masuk
          </td>
        </tr>
      `;
      return;
    }
    
    // Tampilkan records terbaru dulu
    const sortedRecords = [...stockInRecords].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA;
    });
    
    sortedRecords.forEach(record => {
      const row = document.createElement('tr');
      
      // Get product info
      const productName = record.product?.name || 'Unknown';
      const productSku = record.product?.sku || '-';
      const createdDate = new Date(record.createdAt || record.created_at);
      const formattedDate = createdDate.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td><code>${productSku}</code></td>
        <td>${escapeHtml(productName)}</td>
        <td><strong>${record.quantity || 0}</strong></td>
        <td>${record.notes ? escapeHtml(record.notes) : '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStockIn(${record.id})" title="Hapus">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    console.log('✓ Stock in history displayed');
  } catch (error) {
    console.error('❌ Error displaying stock in history:', error);
  }
}

/**
 * Open modal untuk tambah barang masuk
 */
function openStockInModal() {
  // Reset form
  document.getElementById('stockinForm').reset();
  document.getElementById('stockinProductSelect').focus();
}

/**
 * Submit stock in form
 */
async function submitStockIn(event) {
  event.preventDefault();
  
  try {
    const productId = document.getElementById('stockinProductSelect').value;
    const quantity = parseInt(document.getElementById('stockinQuantity').value);
    const notes = document.getElementById('stockinNotes').value.trim();
    
    // Validasi
    if (!productId) {
      showAlertModal('Error!', 'Pilih produk terlebih dahulu', 'warning');
      return;
    }
    
    if (!quantity || quantity <= 0) {
      showAlertModal('Error!', 'Jumlah harus lebih dari 0', 'warning');
      return;
    }
    
    console.log('Submitting stock in:', { productId, quantity, notes });
    
    const response = await fetch('/api/stockin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        product_id: parseInt(productId),
        quantity: quantity,
        notes: notes || null
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to create stock in');
    }
    
    console.log('✓ Stock in created:', data);
    
    // Reset form
    document.getElementById('stockinForm').reset();
    
    // Reload history
    await loadStockInHistory();
    
    // Show success
    showAlertModal('Berhasil!', `${quantity} unit barang masuk telah dicatat`, 'success');
  } catch (error) {
    console.error('❌ Error submitting stock in:', error);
    showAlertModal('Error!', error.message || 'Gagal menyimpan barang masuk', 'danger');
  }
}

/**
 * Delete stock in record
 */
function deleteStockIn(recordId) {
  Swal.fire({
    title: 'Hapus Barang Masuk?',
    text: 'Stok produk akan dikurangi kembali. Aksi ini tidak bisa dibatalkan.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/stockin/${recordId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.message || 'Failed to delete stock in');
        }
        
        console.log('✓ Stock in deleted');
        
        // Reload history
        await loadStockInHistory();
        
        showAlertModal('Berhasil!', 'Barang masuk telah dihapus', 'success');
      } catch (error) {
        console.error('❌ Error deleting stock in:', error);
        showAlertModal('Error!', error.message || 'Gagal menghapus barang masuk', 'danger');
      }
    }
  });
}

/**
 * Handler untuk menampilkan halaman stock in
 */
function handleStockInPage() {
  currentStockInPage = 'stockin';
  initStockInPage();
}

// Export functions untuk global access
window.initStockInPage = initStockInPage;
window.loadStockInProducts = loadStockInProducts;
window.updateStockInProductInfo = updateStockInProductInfo;
window.loadStockInHistory = loadStockInHistory;
window.displayStockInHistory = displayStockInHistory;
window.openStockInModal = openStockInModal;
window.submitStockIn = submitStockIn;
window.deleteStockIn = deleteStockIn;
window.handleStockInPage = handleStockInPage;
