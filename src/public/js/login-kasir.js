/**
 * LOGIN - CASHIER (STAFF KASIR)
 * Mengirim role='cashier' ke backend
 * Backend WAJIB validasi role match
 */

const LOGIN_ROLE = 'cashier';  // Cashier role
const API_LOGIN_URL = '/api/auth/login';

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Clear error on input focus
  [usernameInput, passwordInput].forEach(input => {
    if (input) {
      input.addEventListener('focus', function() {
        clearError();
      });
    }
  });
});

/**
 * Handle login submission
 * Send: username, password, requiredRole
 * Backend will validate role match STRICTLY
 */
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username')?.value?.trim();
  const password = document.getElementById('password')?.value;
  const loginBtn = document.getElementById('loginBtn');

  // ============ VALIDATION ============
  if (!username || !password) {
    showError('Username dan password harus diisi');
    return;
  }

  if (username.length < 3) {
    showError('Username minimal 3 karakter');
    return;
  }

  if (password.length < 6) {
    showError('Password minimal 6 karakter');
    return;
  }

  // ============ DISABLE BUTTON ============
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
  }

  try {
    // ============ SEND LOGIN REQUEST ============
    // PENTING: requiredRole HARUS dikirim dan sesuai dengan tombol login
    const response = await fetch(API_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        requiredRole: LOGIN_ROLE  // ✓ WAJIB: Sesuai role tombol login ini
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // ============ ERROR HANDLING ============
      handleLoginError(response.status, data);
      return;
    }

    if (!data.success || !data.token) {
      showError('Login gagal. Silakan coba lagi.');
      return;
    }

    // ============ LOGIN SUCCESS ============
    console.log(`✓ Login berhasil sebagai ${data.user.username} (${data.user.role})`);
    
    // Save token & user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('sessionId', data.sessionId);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Show success alert with countdown and auto-redirect
    showSuccess(`Selamat datang, ${data.user.name}!`);

  } catch (error) {
    console.error('❌ Login error:', error);
    showError('Terjadi kesalahan. Periksa koneksi Anda.');
  } finally {
    // ============ RE-ENABLE BUTTON ============
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="bi bi-cash-coin"></i> Login Cashier';
    }
  }
}

/**
 * Handle specific login errors
 */
function handleLoginError(statusCode, data) {
  const code = data.code || 'UNKNOWN';
  const message = data.message || 'Login gagal';

  console.error(`❌ Login error [${statusCode}]:`, code, message);
  if (data.debug) {
    console.error('Debug info:', data.debug);
  }

  switch (code) {
    case 'INVALID_INPUT':
      showErrorAlert('Username dan password harus diisi');
      break;
    
    case 'ROLE_REQUIRED':
      showErrorAlert('Pilih role login yang sesuai');
      break;
    
    case 'USER_NOT_FOUND':
    case 'INVALID_PASSWORD':
      showErrorAlert('Username atau password salah');
      break;
    
    case 'ROLE_MISMATCH':
      // ✓ CRITICAL: User mencoba login dengan role yang salah
      console.warn(`❌ ROLE VIOLATION: ${data.userRole} != ${data.requiredRole}`);
      showRoleMismatchAlert(data);
      break;
    
    case 'INVALID_ROLE':
      showErrorAlert('Role login tidak valid');
      break;

    case 'DATABASE_TIMEOUT':
      showErrorAlert('Koneksi database timeout. Pastikan database server berjalan dan dapat diakses. Silakan coba lagi dalam beberapa saat.');
      console.error('Database connection issue - check database server configuration');
      break;

    case 'DATABASE_CONNECTION_ERROR':
      showErrorAlert('Tidak bisa terhubung ke database. Pastikan database server berjalan.');
      console.error('Database connection refused - check database server');
      break;

    case 'DATABASE_ERROR':
      showErrorAlert('Kesalahan koneksi database. Silakan hubungi administrator.');
      break;
    
    case 'SERVER_ERROR':
      showErrorAlert('Terjadi kesalahan pada server. Silakan coba lagi.');
      break;
    
    default:
      showErrorAlert(message || 'Login gagal. Silakan coba lagi.');
  }
}

/**
 * Show error message as inline alert
 */
function showErrorAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show d-flex align-items-center';
  alertDiv.innerHTML = `
    <i class="bi bi-exclamation-circle-fill me-2"></i>
    <span>${message}</span>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const formContainer = document.getElementById('loginForm')?.parentElement;
  if (formContainer) {
    // Remove previous error
    const prevAlert = formContainer.querySelector('.alert');
    if (prevAlert) prevAlert.remove();
    
    // Insert new error before form
    formContainer.insertBefore(alertDiv, document.getElementById('loginForm'));
  }
}

/**
 * Show role mismatch error as inline alert
 */
function showRoleMismatchAlert(data) {
  const username = document.getElementById('username')?.value || 'User';
  const userRole = data.userRole || 'tidak diketahui';
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-warning alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="bi bi-exclamation-triangle-fill me-2"></i>
    <strong>Akun "${username}" adalah role <code>${userRole}</code></strong>
    <div class="mt-2">
      <small>
        <i class="bi bi-info-circle-fill me-2"></i>
        Gunakan <strong>Login Staff Barang</strong> jika role Anda adalah <code>item_user</code>
      </small>
    </div>
    <div class="mt-2">
      <small>
        <i class="bi bi-info-circle-fill me-2"></i>
        Gunakan <strong>Login Cashier</strong> jika role Anda adalah <code>cashier</code>
      </small>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const formContainer = document.getElementById('loginForm')?.parentElement;
  if (formContainer) {
    // Remove previous error
    const prevAlert = formContainer.querySelector('.alert');
    if (prevAlert) prevAlert.remove();
    
    // Insert new error before form
    formContainer.insertBefore(alertDiv, document.getElementById('loginForm'));
  }
}

/**
 * Show error message (deprecated - use showErrorAlert instead)
 */
function showError(message) {
  showErrorAlert(message);
}

/**
 * Show success message with countdown and beautiful styling
 */
function showSuccess(message) {
  let countdownSeconds = 3;
  
  Swal.fire({
    icon: 'success',
    title: 'Login Berhasil! 🎉',
    html: `
      <div class="alert alert-success" role="alert">
        <i class="bi bi-check-circle-fill me-2"></i>
        <strong>${message}</strong>
      </div>
      <div class="mt-3">
        <p class="text-muted small">Mengalihkan dalam <strong><span id="successCountdown">3</span></strong> detik...</p>
        <div class="progress mt-2" style="height: 5px;">
          <div id="progressBar" class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
        </div>
      </div>
    `,
    allowOutsideClick: false,
    didOpen: () => {
      // Countdown and progress bar animation
      const countdownEl = document.getElementById('successCountdown');
      const progressBar = document.getElementById('progressBar');
      let progressWidth = 100;
      
      const countdownInterval = setInterval(() => {
        countdownSeconds--;
        progressWidth -= 33.33;
        
        if (countdownEl) {
          countdownEl.textContent = countdownSeconds;
        }
        if (progressBar) {
          progressBar.style.width = Math.max(0, progressWidth) + '%';
        }
        
        if (countdownSeconds <= 0) {
          clearInterval(countdownInterval);
          // Redirect after countdown
          window.location.href = '/';
        }
      }, 1000);
    }
  });
}

/**
 * Clear error message
 */
function clearError() {
  const alertDiv = document.querySelector('.alert');
  if (alertDiv) alertDiv.remove();
}
