async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const deviceRole = document.getElementById('role').value || 'admin_barang';
  const errorMessage = document.getElementById('errorMessage');
  
  if (!username || !password) {
    errorMessage.textContent = '❌ Username dan password harus diisi';
    errorMessage.classList.add('show');
    return;
  }
  
  try {
    errorMessage.classList.remove('show');
    console.log('📡 Sending login request...');
    console.log('👤 Device role selected:', deviceRole);
    
    // Generate unique device name untuk tracking multiple logins
    const deviceName = `${deviceRole}-${new Date().getTime()}`;
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        password, 
        deviceRole,  // Role yang dipilih untuk device ini
        deviceName   // Nama device untuk identifikasi
      })
    });
    
    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    if (response.ok) {
      // Simpan token, sessionId, dan user info ke localStorage
      // Token sudah memiliki role yang benar dari server
      localStorage.setItem('token', data.token);
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('user', JSON.stringify(data.user)); // User role sudah benar dari server
      localStorage.setItem('deviceRole', data.user.role); // Simpan role device (sesuai yang dari server)
      
      console.log('✓ Login successful');
      console.log('👤 User role:', data.user.role);
      console.log('📱 Session ID:', data.sessionId);
      
      // Redirect ke halaman utama
      window.location.href = '/';
    } else {
      // Tampilkan error
      errorMessage.textContent = '❌ ' + (data.message || 'Login gagal. Periksa username dan password.');
      errorMessage.classList.add('show');
      console.error('❌ Login error:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    errorMessage.textContent = '❌ Terjadi kesalahan koneksi. Pastikan server running.';
    errorMessage.classList.add('show');
  }
}

// Cek apakah user sudah login saat halaman dimuat
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');
  const currentPath = window.location.pathname;
  
  console.log('🔍 Checking token:', token ? '✓ Found' : '❌ Not found');
  console.log('📱 Session ID:', sessionId ? '✓ Found' : '❌ Not found');
  console.log('📍 Current path:', currentPath);
  
  // If user has token and is on login page, redirect to dashboard
  if (token && (currentPath === '/login' || currentPath === '/login.html')) {
    console.log('✓ User sudah login, redirect ke dashboard');
    window.location.href = '/';
    return;
  }
  
  // If user doesn't have token and is on dashboard, redirect to login
  if (!token && currentPath === '/') {
    console.log('❌ User belum login, redirect ke login');
    window.location.href = '/login';
    return;
  }
  
  console.log('✓ Auth check passed');
});
