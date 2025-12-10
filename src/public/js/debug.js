// Debug script untuk troubleshoot

console.log('=== APP DEBUG START ===');
console.log('Current URL:', window.location.href);
console.log('Token exists:', !!localStorage.getItem('token'));

// Check DOM elements
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOM READY ===');
  
  const pages = document.querySelectorAll('.page');
  console.log(`Pages found: ${pages.length}`);
  pages.forEach(p => console.log(`  - ${p.id}`));
  
  const navItems = document.querySelectorAll('.nav-item');
  console.log(`Nav items found: ${navItems.length}`);
  navItems.forEach((item, i) => {
    console.log(`  - ${i}: ${item.getAttribute('data-page')} = ${item.textContent.trim()}`);
    item.addEventListener('click', (e) => {
      console.log('CLICKED:', item.getAttribute('data-page'));
    });
  });
});

// Override console.log untuk tracking
const originalLog = console.log;
window.apiCalls = [];
console.log = function(...args) {
  if (args[0]?.includes?.('API') || args[0]?.includes?.('page')) {
    window.apiCalls.push(args);
  }
  originalLog.apply(console, args);
};

// Enable detailed error logging
window.addEventListener('error', (event) => {
  console.error('❌ Global Error:', event.message);
  console.error('File:', event.filename);
  console.error('Line:', event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);
});

// Debug helper untuk logging semua fetch requests
const originalFetch = window.fetch;

window.fetch = function(...args) {
  const [url, options] = args;
  const method = options?.method || 'GET';
  
  console.log(`📡 Fetch: ${method} ${url}`);
  
  return originalFetch.apply(this, args)
    .then(response => {
      console.log(`   Response Status: ${response.status}`);
      return response;
    })
    .catch(error => {
      console.error(`   ❌ Error: ${error.message}`);
      throw error;
    });
};

// Override console.error untuk lebih visible
const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, args);
  // Log ke window untuk debugging
  if (!window.errorLog) window.errorLog = [];
  window.errorLog.push(args.join(' '));
};

// Test API connection on startup
async function testConnection() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    console.log('✓ API Connection OK:', data);
    return true;
  } catch (error) {
    console.error('❌ API Connection Error:', error);
    return false;
  }
}

console.log('%c🚀 Aplikasi Kasir Dimulai', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
console.log('Token:', localStorage.getItem('token') ? '✓ Ada' : '❌ Tidak ada');
console.log('User:', localStorage.getItem('user') ? '✓ Ada' : '❌ Tidak ada');

// Test connection after page load
window.addEventListener('load', async () => {
  setTimeout(() => {
    testConnection();
  }, 1000);
});
