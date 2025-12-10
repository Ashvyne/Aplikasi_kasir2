// Format currency to IDR
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Parse number safely
function parseNum(val) {
  const num = parseFloat(val) || 0;
  return isNaN(num) ? 0 : num;
}

// API helperibdauvbi
async function apiCall(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) options.body = JSON.stringify(data);
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    alert('Terjadi kesalahan: ' + error.message);
    return null;
  }
}

// Show notification
function showNotification(message, type = 'success') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Could be enhanced with toast notification library
}

// Update time
function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID');
  const dateStr = now.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  document.getElementById('currentTime').textContent = `${dateStr} ${timeStr}`;
}

setInterval(updateTime, 1000);
updateTime();
