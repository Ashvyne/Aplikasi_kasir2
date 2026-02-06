/**
 * APLIKASI PEMINJAMAN ALAT - MAIN JAVASCRIPT
 * Mengelola semua logika frontend aplikasi peminjaman alat
 */

// ============ GLOBAL VARIABLES ============
let equipment = [];
let borrowers = [];
let loans = [];
let currentUser = null;
let currentPage = 'dashboard';
let isLoading = false;

// Chart instances
let charts = {
  loanActivity: null,
  equipmentStatus: null,
  equipmentLoans: null,
  loanDuration: null
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Aplikasi Peminjaman Alat Loading...');
  
  // Check authentication
  checkAuthentication();
  
  // Setup page navigation
  setupPageNavigation();
  
  // Load initial data
  loadDashboard();
  
  // Setup auto-refresh
  setupAutoRefresh();
  
  // Setup clock
  updateClock();
  setInterval(updateClock, 1000);
  
  // Dark mode toggle
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
});

// ============ AUTHENTICATION ============
function checkAuthentication() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || !user.id) {
    window.location.href = '/login.html';
    return;
  }
  
  currentUser = user;
  document.getElementById('userDisplay').textContent = user.name || 'User';
  console.log('✓ Authenticated as:', user.name);
}

function logout() {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  }
}

// ============ PAGE NAVIGATION ============
function setupPageNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.textContent.includes('Logout')) return;
      
      e.preventDefault();
      const page = link.getAttribute('data-page');
      if (page) {
        navigateToPage(page);
      }
    });
  });
}

function navigateToPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  
  // Show selected page
  const pageDom = document.getElementById(`${page}-page`);
  if (pageDom) {
    pageDom.classList.add('active');
    currentPage = page;
    document.getElementById('pageTitle').textContent = getTitleByPage(page);
    
    // Load page data
    loadPageData(page);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
      }
    });
  }
}

function getTitleByPage(page) {
  const titles = {
    dashboard: '📊 Dashboard',
    equipment: '🔧 Data Alat',
    borrowers: '👥 Data Peminjam',
    loans: '📦 Peminjaman Alat',
    reports: '📊 Laporan'
  };
  return titles[page] || 'Halaman';
}

function loadPageData(page) {
  switch(page) {
    case 'equipment':
      loadEquipment();
      break;
    case 'borrowers':
      loadBorrowers();
      break;
    case 'loans':
      loadLoans();
      break;
    case 'reports':
      loadReports();
      break;
    case 'dashboard':
      loadDashboard();
      break;
  }
}

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    isLoading = true;
    
    // Load all data
    await Promise.all([
      loadEquipment(),
      loadBorrowers(),
      loadLoans()
    ]);
    
    // Update KPI cards
    document.getElementById('totalEquipment').textContent = equipment.filter(e => e.is_active).length;
    document.getElementById('totalBorrowers').textContent = borrowers.filter(b => b.is_active).length;
    
    const activeLoans = loans.filter(l => l.status === 'Aktif').length;
    const lateLoans = loans.filter(l => l.is_late && l.status === 'Aktif').length;
    
    document.getElementById('activeLoans').textContent = activeLoans;
    document.getElementById('lateLoans').textContent = lateLoans;
    
    // Initialize charts
    setTimeout(() => {
      initCharts();
    }, 500);
    
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    showAlert('error', 'Gagal memuat dashboard');
  } finally {
    isLoading = false;
  }
}

// ============ EQUIPMENT MANAGEMENT ============
async function loadEquipment() {
  try {
    const response = await fetch('/api/equipment', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Failed to load equipment');
    
    const data = await response.json();
    equipment = data.equipment || [];
    
    if (currentPage === 'equipment') {
      displayEquipmentTable();
    }
    
    return equipment;
  } catch (error) {
    console.error('❌ Error loading equipment:', error);
    if (currentPage === 'equipment') {
      showAlert('error', 'Gagal memuat data alat');
    }
    return [];
  }
}

function displayEquipmentTable() {
  const tbody = document.getElementById('equipmentTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = equipment.filter(e => e.is_active).map(e => `
    <tr>
      <td><span class="badge bg-light text-dark">${e.code}</span></td>
      <td><strong>${e.name}</strong></td>
      <td>${e.category || '-'}</td>
      <td>Rp ${new Intl.NumberFormat('id-ID').format(e.daily_rental_rate)}</td>
      <td>${e.total_quantity}</td>
      <td>
        <span class="badge ${e.available_quantity > 0 ? 'bg-success' : 'bg-danger'}">
          ${e.available_quantity}
        </span>
      </td>
      <td>${e.condition}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="editEquipment(${e.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteEquipment(${e.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openEquipmentModal() {
  const form = document.createElement('form');
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Nama Alat *</label>
      <input type="text" class="form-control" id="equipmentName" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Kode Alat *</label>
      <input type="text" class="form-control" id="equipmentCode" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Kategori</label>
      <input type="text" class="form-control" id="equipmentCategory">
    </div>
    <div class="mb-3">
      <label class="form-label">Tarif Sewa/Hari (Rp) *</label>
      <input type="number" class="form-control" id="equipmentRate" required min="0">
    </div>
    <div class="mb-3">
      <label class="form-label">Total Unit *</label>
      <input type="number" class="form-control" id="equipmentQuantity" value="1" required min="1">
    </div>
    <div class="mb-3">
      <label class="form-label">Deskripsi</label>
      <textarea class="form-control" id="equipmentDescription" rows="3"></textarea>
    </div>
  `;
  
  Swal.fire({
    title: 'Tambah Alat Baru',
    html: form,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    preConfirm: async () => {
      const name = document.getElementById('equipmentName').value;
      const code = document.getElementById('equipmentCode').value;
      const category = document.getElementById('equipmentCategory').value;
      const rate = document.getElementById('equipmentRate').value;
      const quantity = document.getElementById('equipmentQuantity').value;
      const description = document.getElementById('equipmentDescription').value;
      
      if (!name || !code || !rate) {
        Swal.showValidationMessage('Kolom wajib harus diisi!');
        return false;
      }
      
      return { name, code, category, daily_rental_rate: parseInt(rate), total_quantity: parseInt(quantity), description };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/equipment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        });
        
        if (!response.ok) throw new Error('Failed to create equipment');
        
        showAlert('success', 'Alat berhasil ditambahkan');
        await loadEquipment();
      } catch (error) {
        showAlert('error', 'Gagal menambahkan alat: ' + error.message);
      }
    }
  });
}

function editEquipment(id) {
  const eq = equipment.find(e => e.id === id);
  if (!eq) return;
  
  const form = document.createElement('form');
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Nama Alat *</label>
      <input type="text" class="form-control" id="equipmentName" value="${eq.name}" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Kategori</label>
      <input type="text" class="form-control" id="equipmentCategory" value="${eq.category || ''}">
    </div>
    <div class="mb-3">
      <label class="form-label">Tarif Sewa/Hari (Rp) *</label>
      <input type="number" class="form-control" id="equipmentRate" value="${eq.daily_rental_rate}" required min="0">
    </div>
    <div class="mb-3">
      <label class="form-label">Kondisi</label>
      <select class="form-select" id="equipmentCondition">
        <option value="Baik" ${eq.condition === 'Baik' ? 'selected' : ''}>Baik</option>
        <option value="Rusak Ringan" ${eq.condition === 'Rusak Ringan' ? 'selected' : ''}>Rusak Ringan</option>
        <option value="Rusak Berat" ${eq.condition === 'Rusak Berat' ? 'selected' : ''}>Rusak Berat</option>
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Deskripsi</label>
      <textarea class="form-control" id="equipmentDescription" rows="3">${eq.description || ''}</textarea>
    </div>
  `;
  
  Swal.fire({
    title: 'Edit Alat',
    html: form,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    preConfirm: async () => {
      const name = document.getElementById('equipmentName').value;
      const category = document.getElementById('equipmentCategory').value;
      const rate = document.getElementById('equipmentRate').value;
      const condition = document.getElementById('equipmentCondition').value;
      const description = document.getElementById('equipmentDescription').value;
      
      if (!name || !rate) {
        Swal.showValidationMessage('Kolom wajib harus diisi!');
        return false;
      }
      
      return { name, category, daily_rental_rate: parseInt(rate), condition, description };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/equipment/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        });
        
        if (!response.ok) throw new Error('Failed to update equipment');
        
        showAlert('success', 'Alat berhasil diperbarui');
        await loadEquipment();
      } catch (error) {
        showAlert('error', 'Gagal mengupdate alat: ' + error.message);
      }
    }
  });
}

function deleteEquipment(id) {
  Swal.fire({
    title: 'Hapus Alat?',
    text: 'Tindakan ini tidak dapat dibatalkan',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Hapus'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/equipment/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete equipment');
        
        showAlert('success', 'Alat berhasil dihapus');
        await loadEquipment();
      } catch (error) {
        showAlert('error', 'Gagal menghapus alat: ' + error.message);
      }
    }
  });
}

function filterEquipment() {
  const search = document.getElementById('equipmentSearch').value.toLowerCase();
  const category = document.getElementById('equipmentCategory').value;
  
  const filtered = equipment.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search) || e.code.toLowerCase().includes(search);
    const matchCategory = !category || e.category === category;
    return matchSearch && matchCategory && e.is_active;
  });
  
  document.getElementById('equipmentTableBody').innerHTML = filtered.map(e => `
    <tr>
      <td><span class="badge bg-light text-dark">${e.code}</span></td>
      <td><strong>${e.name}</strong></td>
      <td>${e.category || '-'}</td>
      <td>Rp ${new Intl.NumberFormat('id-ID').format(e.daily_rental_rate)}</td>
      <td>${e.total_quantity}</td>
      <td>
        <span class="badge ${e.available_quantity > 0 ? 'bg-success' : 'bg-danger'}">
          ${e.available_quantity}
        </span>
      </td>
      <td>${e.condition}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="editEquipment(${e.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteEquipment(${e.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function resetEquipmentFilter() {
  document.getElementById('equipmentSearch').value = '';
  document.getElementById('equipmentCategory').value = '';
  displayEquipmentTable();
}

// ============ BORROWER MANAGEMENT ============
async function loadBorrowers() {
  try {
    const response = await fetch('/api/borrowers', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Failed to load borrowers');
    
    const data = await response.json();
    borrowers = data.borrowers || [];
    
    if (currentPage === 'borrowers') {
      displayBorrowerTable();
    }
    
    return borrowers;
  } catch (error) {
    console.error('❌ Error loading borrowers:', error);
    if (currentPage === 'borrowers') {
      showAlert('error', 'Gagal memuat data peminjam');
    }
    return [];
  }
}

function displayBorrowerTable() {
  const tbody = document.getElementById('borrowerTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = borrowers.filter(b => b.is_active).map(b => `
    <tr>
      <td><strong>${b.name}</strong></td>
      <td>${b.email || '-'}</td>
      <td>${b.phone}</td>
      <td>${b.organization || '-'}</td>
      <td>
        <span class="badge ${b.is_verified ? 'bg-success' : 'bg-warning'}">
          ${b.is_verified ? '✓ Verifikasi' : 'Menunggu'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-info" onclick="editBorrower(${b.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteBorrower(${b.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openBorrowerModal() {
  const form = document.createElement('form');
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Nama Lengkap *</label>
      <input type="text" class="form-control" id="borrowerName" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Email</label>
      <input type="email" class="form-control" id="borrowerEmail">
    </div>
    <div class="mb-3">
      <label class="form-label">Nomor Telepon *</label>
      <input type="tel" class="form-control" id="borrowerPhone" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Jenis Identitas</label>
      <select class="form-select" id="borrowerIdentityType">
        <option value="KTP">KTP</option>
        <option value="SIM">SIM</option>
        <option value="Pasport">Pasport</option>
        <option value="Identitas Lainnya">Identitas Lainnya</option>
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Nomor Identitas</label>
      <input type="text" class="form-control" id="borrowerIdentityNumber">
    </div>
    <div class="mb-3">
      <label class="form-label">Organisasi/Perusahaan</label>
      <input type="text" class="form-control" id="borrowerOrganization">
    </div>
    <div class="mb-3">
      <label class="form-label">Alamat</label>
      <textarea class="form-control" id="borrowerAddress" rows="2"></textarea>
    </div>
  `;
  
  Swal.fire({
    title: 'Tambah Peminjam Baru',
    html: form,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    preConfirm: async () => {
      const name = document.getElementById('borrowerName').value;
      const phone = document.getElementById('borrowerPhone').value;
      
      if (!name || !phone) {
        Swal.showValidationMessage('Nama dan telepon wajib diisi!');
        return false;
      }
      
      return {
        name,
        email: document.getElementById('borrowerEmail').value || null,
        phone,
        identity_type: document.getElementById('borrowerIdentityType').value,
        identity_number: document.getElementById('borrowerIdentityNumber').value || null,
        organization: document.getElementById('borrowerOrganization').value || null,
        address: document.getElementById('borrowerAddress').value || null
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/borrowers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        });
        
        if (!response.ok) throw new Error('Failed to create borrower');
        
        showAlert('success', 'Peminjam berhasil ditambahkan');
        await loadBorrowers();
      } catch (error) {
        showAlert('error', 'Gagal menambahkan peminjam: ' + error.message);
      }
    }
  });
}

function editBorrower(id) {
  const borrower = borrowers.find(b => b.id === id);
  if (!borrower) return;
  
  const form = document.createElement('form');
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Nama Lengkap *</label>
      <input type="text" class="form-control" id="borrowerName" value="${borrower.name}" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Email</label>
      <input type="email" class="form-control" id="borrowerEmail" value="${borrower.email || ''}">
    </div>
    <div class="mb-3">
      <label class="form-label">Nomor Telepon *</label>
      <input type="tel" class="form-control" id="borrowerPhone" value="${borrower.phone}" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Organisasi/Perusahaan</label>
      <input type="text" class="form-control" id="borrowerOrganization" value="${borrower.organization || ''}">
    </div>
    <div class="mb-3">
      <label class="form-label">Alamat</label>
      <textarea class="form-control" id="borrowerAddress" rows="2">${borrower.address || ''}</textarea>
    </div>
  `;
  
  Swal.fire({
    title: 'Edit Peminjam',
    html: form,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    preConfirm: async () => {
      const name = document.getElementById('borrowerName').value;
      const phone = document.getElementById('borrowerPhone').value;
      
      if (!name || !phone) {
        Swal.showValidationMessage('Nama dan telepon wajib diisi!');
        return false;
      }
      
      return {
        name,
        email: document.getElementById('borrowerEmail').value || null,
        phone,
        organization: document.getElementById('borrowerOrganization').value || null,
        address: document.getElementById('borrowerAddress').value || null
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/borrowers/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        });
        
        if (!response.ok) throw new Error('Failed to update borrower');
        
        showAlert('success', 'Peminjam berhasil diperbarui');
        await loadBorrowers();
      } catch (error) {
        showAlert('error', 'Gagal mengupdate peminjam: ' + error.message);
      }
    }
  });
}

function deleteBorrower(id) {
  Swal.fire({
    title: 'Hapus Peminjam?',
    text: 'Tindakan ini tidak dapat dibatalkan',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Hapus'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/borrowers/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete borrower');
        
        showAlert('success', 'Peminjam berhasil dihapus');
        await loadBorrowers();
      } catch (error) {
        showAlert('error', 'Gagal menghapus peminjam: ' + error.message);
      }
    }
  });
}

function filterBorrowers() {
  const search = document.getElementById('borrowerSearch').value.toLowerCase();
  
  const filtered = borrowers.filter(b => {
    return (b.is_active &&
      (b.name.toLowerCase().includes(search) ||
       b.email?.toLowerCase().includes(search) ||
       b.phone.includes(search) ||
       b.organization?.toLowerCase().includes(search))
    );
  });
  
  document.getElementById('borrowerTableBody').innerHTML = filtered.map(b => `
    <tr>
      <td><strong>${b.name}</strong></td>
      <td>${b.email || '-'}</td>
      <td>${b.phone}</td>
      <td>${b.organization || '-'}</td>
      <td>
        <span class="badge ${b.is_verified ? 'bg-success' : 'bg-warning'}">
          ${b.is_verified ? '✓ Verifikasi' : 'Menunggu'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-info" onclick="editBorrower(${b.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteBorrower(${b.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ============ LOAN MANAGEMENT ============
async function loadLoans() {
  try {
    const response = await fetch('/api/loans', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Failed to load loans');
    
    const data = await response.json();
    loans = data.loans || [];
    
    if (currentPage === 'loans') {
      displayLoansTable();
    }
    
    return loans;
  } catch (error) {
    console.error('❌ Error loading loans:', error);
    if (currentPage === 'loans') {
      showAlert('error', 'Gagal memuat data peminjaman');
    }
    return [];
  }
}

function displayLoansTable() {
  const tbody = document.getElementById('loanTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = loans.map(loan => `
    <tr>
      <td><span class="badge bg-light text-dark">${loan.loan_number}</span></td>
      <td>${loan.borrower?.name || '-'}</td>
      <td>${loan.equipment?.name || '-'}</td>
      <td>${new Date(loan.loan_date).toLocaleDateString('id-ID')}</td>
      <td>${new Date(loan.due_date).toLocaleDateString('id-ID')}</td>
      <td>
        <span class="badge ${getStatusBadge(loan.status)}">
          ${loan.status}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="viewLoanDetail(${loan.id})">
          <i class="bi bi-eye"></i>
        </button>
        ${loan.status === 'Aktif' ? `
          <button class="btn btn-sm btn-success" onclick="returnLoanModal(${loan.id})">
            <i class="bi bi-check-circle"></i> Kembalikan
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

function getStatusBadge(status) {
  const badges = {
    'Aktif': 'bg-info',
    'Terlambat': 'bg-danger',
    'Selesai': 'bg-success',
    'Dibatalkan': 'bg-secondary'
  };
  return badges[status] || 'bg-secondary';
}

function openLoanModal() {
  const form = document.createElement('form');
  const equipmentOptions = equipment.filter(e => e.is_active && e.available_quantity > 0)
    .map(e => `<option value="${e.id}">${e.name} (${e.available_quantity}/${e.total_quantity})</option>`)
    .join('');
  
  const borrowerOptions = borrowers.filter(b => b.is_active)
    .map(b => `<option value="${b.id}">${b.name}</option>`)
    .join('');
  
  const today = new Date().toISOString().split('T')[0];
  
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Peminjam *</label>
      <select class="form-select" id="loanBorrower" required>
        <option value="">-- Pilih Peminjam --</option>
        ${borrowerOptions}
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Alat *</label>
      <select class="form-select" id="loanEquipment" required>
        <option value="">-- Pilih Alat --</option>
        ${equipmentOptions}
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Jumlah Unit *</label>
      <input type="number" class="form-control" id="loanQuantity" value="1" required min="1">
    </div>
    <div class="mb-3">
      <label class="form-label">Tanggal Pinjam *</label>
      <input type="date" class="form-control" id="loanDate" value="${today}" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Jatuh Tempo (tanggal kembali) *</label>
      <input type="date" class="form-control" id="loanDueDate" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Catatan</label>
      <textarea class="form-control" id="loanNotes" rows="2"></textarea>
    </div>
  `;
  
  Swal.fire({
    title: 'Peminjaman Alat Baru',
    html: form,
    showCancelButton: true,
    confirmButtonText: 'Buat Peminjaman',
    preConfirm: async () => {
      const borrower_id = document.getElementById('loanBorrower').value;
      const equipment_id = document.getElementById('loanEquipment').value;
      const quantity = document.getElementById('loanQuantity').value;
      const loan_date = document.getElementById('loanDate').value;
      const due_date = document.getElementById('loanDueDate').value;
      const notes = document.getElementById('loanNotes').value;
      
      if (!borrower_id || !equipment_id || !loan_date || !due_date) {
        Swal.showValidationMessage('Kolom wajib harus diisi!');
        return false;
      }
      
      return { borrower_id: parseInt(borrower_id), equipment_id: parseInt(equipment_id), quantity: parseInt(quantity), loan_date, due_date, notes };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/loans', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Failed to create loan');
        }
        
        showAlert('success', 'Peminjaman berhasil dibuat');
        await loadLoans();
      } catch (error) {
        showAlert('error', 'Gagal membuat peminjaman: ' + error.message);
      }
    }
  });
}

function viewLoanDetail(id) {
  const loan = loans.find(l => l.id === id);
  if (!loan) return;
  
  const rentalCost = loan.rental_cost || 0;
  const damageCost = loan.damage_cost || 0;
  const lateFee = loan.late_fee || 0;
  const totalCost = rentalCost + damageCost + lateFee;
  
  Swal.fire({
    title: `Detail Peminjaman ${loan.loan_number}`,
    html: `
      <div style="text-align: left;">
        <p><strong>Peminjam:</strong> ${loan.borrower?.name || '-'}</p>
        <p><strong>Alat:</strong> ${loan.equipment?.name || '-'}</p>
        <p><strong>Jumlah:</strong> ${loan.quantity} unit</p>
        <p><strong>Tanggal Pinjam:</strong> ${new Date(loan.loan_date).toLocaleDateString('id-ID')}</p>
        <p><strong>Jatuh Tempo:</strong> ${new Date(loan.due_date).toLocaleDateString('id-ID')}</p>
        ${loan.return_date ? `<p><strong>Tanggal Kembali:</strong> ${new Date(loan.return_date).toLocaleDateString('id-ID')}</p>` : ''}
        <p><strong>Status:</strong> <span class="badge ${getStatusBadge(loan.status)}">${loan.status}</span></p>
        ${loan.return_condition ? `<p><strong>Kondisi Pengembalian:</strong> ${loan.return_condition}</p>` : ''}
        ${loan.damage_notes ? `<p><strong>Catatan Kerusakan:</strong> ${loan.damage_notes}</p>` : ''}
        <hr>
        ${loan.status === 'Selesai' ? `
          <p><strong>Biaya Sewa:</strong> Rp ${new Intl.NumberFormat('id-ID').format(rentalCost)}</p>
          <p><strong>Biaya Kerusakan:</strong> Rp ${new Intl.NumberFormat('id-ID').format(damageCost)}</p>
          <p><strong>Denda Keterlambatan:</strong> Rp ${new Intl.NumberFormat('id-ID').format(lateFee)}</p>
          <p style="border-top: 2px solid #ccc; padding-top: 10px;"><strong>Total Biaya:</strong> Rp ${new Intl.NumberFormat('id-ID').format(totalCost)}</p>
        ` : ''}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Tutup'
  });
}

function returnLoanModal(id) {
  const form = document.createElement('form');
  const today = new Date().toISOString().split('T')[0];
  
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Tanggal Pengembalian *</label>
      <input type="date" class="form-control" id="returnDate" value="${today}" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Kondisi Alat *</label>
      <select class="form-select" id="returnCondition" required>
        <option value="">-- Pilih Kondisi --</option>
        <option value="Baik">Baik</option>
        <option value="Rusak Ringan">Rusak Ringan</option>
        <option value="Rusak Berat">Rusak Berat</option>
        <option value="Hilang">Hilang</option>
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Catatan Kerusakan</label>
      <textarea class="form-control" id="damageNotes" rows="2"></textarea>
    </div>
    <div class="mb-3">
      <label class="form-label">Biaya Perbaikan/Ganti (Rp)</label>
      <input type="number" class="form-control" id="damageCost" value="0" min="0">
    </div>
  `;
  
  Swal.fire({
    title: 'Pengembalian Alat',
    html: form,
    showCancelButton: true,
    confirmButtonText: 'Proses Pengembalian',
    preConfirm: async () => {
      const return_date = document.getElementById('returnDate').value;
      const return_condition = document.getElementById('returnCondition').value;
      const damage_notes = document.getElementById('damageNotes').value;
      const damage_cost = document.getElementById('damageCost').value;
      
      if (!return_date || !return_condition) {
        Swal.showValidationMessage('Tanggal dan kondisi wajib diisi!');
        return false;
      }
      
      return { return_date, return_condition, damage_notes, damage_cost: parseInt(damage_cost) || 0 };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/loans/${id}/return`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        });
        
        if (!response.ok) throw new Error('Failed to process return');
        
        const data = await response.json();
        showAlert('success', 'Pengembalian berhasil diproses');
        await loadLoans();
        
        // Show rental summary
        const summary = data.loan.rental_summary;
        Swal.fire({
          title: 'Ringkasan Biaya',
          html: `
            <div style="text-align: left;">
              <p><strong>Durasi Peminjaman:</strong> ${summary.daysBorrowed} hari</p>
              <p><strong>Tarif Harian:</strong> Rp ${new Intl.NumberFormat('id-ID').format(summary.dailyRate)}</p>
              <p><strong>Biaya Sewa:</strong> Rp ${new Intl.NumberFormat('id-ID').format(summary.rentalCost)}</p>
              ${summary.isLate ? `
                <p><strong>Terlambat:</strong> ${summary.lateDays} hari</p>
                <p><strong>Denda (50%):</strong> Rp ${new Intl.NumberFormat('id-ID').format(summary.lateFee)}</p>
              ` : ''}
              <p><strong>Biaya Kerusakan:</strong> Rp ${new Intl.NumberFormat('id-ID').format(data.loan.damage_cost || 0)}</p>
              <hr>
              <h5><strong>TOTAL:</strong> Rp ${new Intl.NumberFormat('id-ID').format(summary.totalCost)}</h5>
            </div>
          `
        });
      } catch (error) {
        showAlert('error', 'Gagal memproses pengembalian: ' + error.message);
      }
    }
  });
}

function filterLoansByStatus(status) {
  // Update tab active state
  document.querySelectorAll('#loanTabs .nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.includes(status)) {
      link.classList.add('active');
    }
  });
  
  const tbody = document.getElementById('loanTableBody');
  const filtered = loans.filter(l => l.status === status);
  
  tbody.innerHTML = filtered.map(loan => `
    <tr>
      <td><span class="badge bg-light text-dark">${loan.loan_number}</span></td>
      <td>${loan.borrower?.name || '-'}</td>
      <td>${loan.equipment?.name || '-'}</td>
      <td>${new Date(loan.loan_date).toLocaleDateString('id-ID')}</td>
      <td>${new Date(loan.due_date).toLocaleDateString('id-ID')}</td>
      <td>
        <span class="badge ${getStatusBadge(loan.status)}">
          ${loan.status}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="viewLoanDetail(${loan.id})">
          <i class="bi bi-eye"></i>
        </button>
        ${loan.status === 'Aktif' ? `
          <button class="btn btn-sm btn-success" onclick="returnLoanModal(${loan.id})">
            <i class="bi bi-check-circle"></i> Kembalikan
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

// ============ REPORTS ============
async function loadReports() {
  try {
    // Charts akan di-initialize di sini
    setTimeout(() => {
      initReportCharts();
    }, 500);
  } catch (error) {
    console.error('❌ Error loading reports:', error);
  }
}

// ============ CHARTS ============
function initCharts() {
  // Loan Activity Chart
  const loanDates = {};
  loans.forEach(loan => {
    const date = new Date(loan.loan_date).toLocaleDateString('id-ID');
    loanDates[date] = (loanDates[date] || 0) + 1;
  });
  
  const chartDates = Object.keys(loanDates).sort();
  const chartData = chartDates.map(d => loanDates[d]);
  
  if (charts.loanActivity) charts.loanActivity.destroy();
  
  charts.loanActivity = new ApexCharts(document.getElementById('loanActivityChart'), {
    series: [{ name: 'Peminjaman', data: chartData }],
    chart: { type: 'line', height: 350 },
    xaxis: { categories: chartDates }
  }).render();
  
  // Equipment Status Chart
  const availableCount = equipment.filter(e => e.is_active && e.available_quantity > 0).length;
  const borrowedCount = equipment.filter(e => e.is_active && e.available_quantity === 0).length;
  
  if (charts.equipmentStatus) charts.equipmentStatus.destroy();
  
  charts.equipmentStatus = new ApexCharts(document.getElementById('equipmentStatusChart'), {
    series: [availableCount, borrowedCount],
    chart: { type: 'donut', height: 350 },
    labels: ['Tersedia', 'Semua Dipinjam']
  }).render();
}

function initReportCharts() {
  // Equipment Loans Chart
  const equipmentLoans = {};
  loans.forEach(loan => {
    if (loan.equipment?.name) {
      equipmentLoans[loan.equipment.name] = (equipmentLoans[loan.equipment.name] || 0) + 1;
    }
  });
  
  if (charts.equipmentLoans) charts.equipmentLoans.destroy();
  
  charts.equipmentLoans = new ApexCharts(document.getElementById('equipmentLoansChart'), {
    series: [{ name: 'Jumlah Peminjaman', data: Object.values(equipmentLoans) }],
    chart: { type: 'bar', height: 350 },
    xaxis: { categories: Object.keys(equipmentLoans) }
  }).render();
  
  // Loan Duration Chart
  const durations = [];
  loans.filter(l => l.status === 'Selesai').forEach(loan => {
    const start = new Date(loan.loan_date);
    const end = new Date(loan.return_date || loan.due_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    durations.push(days);
  });
  
  if (charts.loanDuration) charts.loanDuration.destroy();
  
  charts.loanDuration = new ApexCharts(document.getElementById('loanDurationChart'), {
    series: [{ name: 'Hari', data: durations }],
    chart: { type: 'bar', height: 350 },
    xaxis: { categories: durations.map((_, i) => `Peminjaman ${i + 1}`) }
  }).render();
}

// ============ AUTO REFRESH ============
function setupAutoRefresh() {
  // Refresh data every 5 minutes
  setInterval(() => {
    if (currentPage === 'dashboard') {
      loadDashboard();
    } else {
      loadPageData(currentPage);
    }
  }, 5 * 60 * 1000);
}

// ============ UTILITY FUNCTIONS ============
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('currentTime').textContent = `${dateStr} ${timeStr}`;
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function showAlert(type, message) {
  const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-warning';
  const alert = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  // Add to current page's alert container
  const container = document.getElementById(`${currentPage}AlertContainer`) ||
                   document.getElementById('productsAlertContainer');
  if (container) {
    container.innerHTML = alert;
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }
}

// Check if dark mode was previously enabled
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}
