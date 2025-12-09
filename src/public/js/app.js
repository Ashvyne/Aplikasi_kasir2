// Check authentication
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
  }
});

// Get token helper
function getToken() {
  return localStorage.getItem('token');
}

// Update apiCall to include token
async function apiCall(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };
  
  if (data) options.body = JSON.stringify(data);
  
  try {
    const response = await fetch(url, options);
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    alert('Terjadi kesalahan: ' + error.message);
    return null;
  }
}

// Logout function
function logout() {
  if (confirm('Yakin ingin logout?')) {
    localStorage.clear();
    window.location.href = '/login';
  }
}

// Add export functions
function printStruk(transactionId) {
  const token = getToken();
  window.open(`/api/exports/struk/${transactionId}?token=${token}`, '_blank');
}

function exportSalesExcel() {
  const token = getToken();
  window.location.href = `/api/exports/sales-excel?token=${token}`;
}

function exportProductsExcel() {
  const token = getToken();
  window.location.href = `/api/exports/products-excel?token=${token}`;
}