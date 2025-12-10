async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMessage = document.getElementById('errorMessage');
  
  if (!username || !password) {
    errorMessage.textContent = '❌ Username dan password harus diisi';
    errorMessage.classList.add('show');
    return;
  }
  
  try {
    errorMessage.classList.remove('show');
    console.log('📡 Sending login request...');
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    if (response.ok) {
      // Simpan token dan user info ke localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('✓ Login successful');
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
  console.log('🔍 Checking token:', token ? '✓ Found' : '❌ Not found');
  
  if (token && !window.location.pathname.includes('login')) {
    console.log('✓ User sudah login, lanjut ke dashboard');
  } else if (!token && window.location.pathname === '/') {
    console.log('❌ User belum login, redirect ke login');
    window.location.href = '/login';
  }
});
