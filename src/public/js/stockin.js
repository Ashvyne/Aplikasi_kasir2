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
 * Load products untuk card grid barang masuk
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
    
    // Store for later use
    window.stockinAvailableProducts = products;
    
    // Display product cards in grid
    displayStockInProductCards(products);
    
    console.log('✓ Stock in products loaded:', products.length);
  } catch (error) {
    console.error('❌ Error loading stock in products:', error);
    showAlertModal('Error!', 'Gagal memuat data produk', 'danger');
  }
}

/**
 * Display product cards dalam grid layout
 */
function displayStockInProductCards(products) {
  const grid = document.getElementById('stockinProductGrid');
  
  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center text-muted py-4">
        <i class="bi bi-inbox"></i> Tidak ada produk tersedia
      </div>
    `;
    return;
  }
  
  grid.innerHTML = products.map(product => {
    const imageUrl = product.image_url || '/images/placeholder.png';
    const stock = product.stock || 0;
    const stockStatus = stock > 0 ? 'text-success' : 'text-danger';
    
    return `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card product-card h-100 cursor-pointer border-2 border-transparent transition-all" 
             onclick="selectStockInProduct(${product.id})" 
             data-product-id="${product.id}"
             style="cursor: pointer;">
          <div class="position-relative overflow-hidden" style="height: 150px; background: #f8f9fa;">
            <img src="${imageUrl}" alt="${product.name}" 
                 class="w-100 h-100" style="object-fit: cover;">
            <div class="position-absolute top-0 end-0 m-2">
              <span class="badge bg-info">${stock} stok</span>
            </div>
          </div>
          <div class="card-body p-2">
            <div class="fw-bold small text-truncate" title="${product.name}">${product.name}</div>
            <div class="text-muted small">SKU: ${product.sku}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✓ Product cards displayed');
}

/**
 * Select product dari card dan buka detail modal
 */
function selectStockInProduct(productId) {
  try {
    const product = window.stockinAvailableProducts.find(p => p.id === productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }
    
    // Update hidden input
    document.getElementById('stockinProductId').value = productId;
    
    // Update detail product info di modal detail
    const imageUrl = product.image_url || '/images/placeholder.png';
    
    document.getElementById('detailProductImage').src = imageUrl;
    document.getElementById('detailProductName').textContent = product.name;
    document.getElementById('detailProductSku').textContent = product.sku;
    document.getElementById('detailProductStock').textContent = (product.stock || 0) + ' unit';
    
    // Close first modal
    const firstModal = bootstrap.Modal.getInstance(document.getElementById('stockinModal'));
    if (firstModal) {
      firstModal.hide();
    }
    
    // Reset detail form
    document.getElementById('stockinDetailForm').reset();
    document.getElementById('stockinQuantity').focus();
    
    // Open detail modal
    const detailModal = new bootstrap.Modal(document.getElementById('stockinDetailModal'));
    detailModal.show();
    
    console.log('✓ Product selected, detail modal opened:', product.name);
  } catch (error) {
    console.error('❌ Error selecting stock in product:', error);
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
  document.getElementById('stockinProductId').value = '';
  
  // Reset detail form
  document.getElementById('stockinDetailForm').reset();
  
  // Clear selection highlight
  document.querySelectorAll('#stockinProductGrid .product-card').forEach(card => {
    card.classList.remove('border-success', 'bg-light');
  });
}

/**
 * Close detail modal dan kembali ke product selection
 */
function closeStockInDetailModal() {
  try {
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('stockinDetailModal'));
    if (detailModal) {
      detailModal.hide();
    }
    
    // Clear selected product
    document.getElementById('stockinProductId').value = '';
    document.getElementById('stockinDetailForm').reset();
  } catch (error) {
    console.error('❌ Error closing detail modal:', error);
  }
}

/**
 * Submit stock in form
 */
async function submitStockIn(event) {
  event.preventDefault();
  
  try {
    const productId = document.getElementById('stockinProductId').value;
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
    
    // Reset forms
    document.getElementById('stockinDetailForm').reset();
    document.getElementById('stockinProductId').value = '';
    
    // Close detail modal
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('stockinDetailModal'));
    if (detailModal) {
      detailModal.hide();
    }
    
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
window.displayStockInProductCards = displayStockInProductCards;
window.selectStockInProduct = selectStockInProduct;
window.loadStockInHistory = loadStockInHistory;
window.displayStockInHistory = displayStockInHistory;
window.openStockInModal = openStockInModal;
window.closeStockInDetailModal = closeStockInDetailModal;
window.submitStockIn = submitStockIn;
window.deleteStockIn = deleteStockIn;
window.handleStockInPage = handleStockInPage;
