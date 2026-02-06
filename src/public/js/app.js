/**
 * Frontend Shared Utilities
 * 
 * Menyediakan:
 * - API request helper dengan token management
 * - Authentication helpers
 * - Error handling
 * - Token expiration checking
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// ============ TOKEN MANAGEMENT ============

/**
 * Get stored token from localStorage
 */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Save token to localStorage
 */
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get stored user data
 */
function getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

/**
 * Save user data to localStorage
 */
function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Check if token exists
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Check if token is expired
 */
function isTokenExpired() {
    const token = getToken();
    if (!token) return true;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresIn = (payload.exp * 1000) - Date.now();
        return expiresIn < 0;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
}

/**
 * Get token expiration time in minutes
 */
function getTokenExpiresIn() {
    const token = getToken();
    if (!token) return 0;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresIn = (payload.exp * 1000) - Date.now();
        return Math.floor(expiresIn / 1000 / 60); // Convert to minutes
    } catch (error) {
        return 0;
    }
}

/**
 * Clear authentication data
 */
function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Logout user and redirect to login
 */
function logout() {
    clearAuth();
    window.location.href = '/login-new';
}

// ============ API REQUEST HELPER ============

/**
 * Make authenticated API request
 * 
 * @param {string} endpoint - API endpoint (e.g., '/users')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {object} body - Request body data
 * @returns {Promise<object>} API response data
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = getToken();

    // Check if authenticated
    if (!token) {
        throw new Error('Authentication required. Please login.');
    }

    // Check if token expired
    if (isTokenExpired()) {
        clearAuth();
        window.location.href = '/login-new?expired=true';
        throw new Error('Session expired. Please login again.');
    }

    // Build headers
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Build request options
    const options = {
        method,
        headers
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Handle different status codes
        if (response.status === 401) {
            clearAuth();
            window.location.href = '/login-new';
            throw new Error('Session expired. Please login again.');
        }

        if (response.status === 403) {
            throw new Error('You do not have permission for this action.');
        }

        if (response.status === 404) {
            throw new Error('Resource not found.');
        }

        if (response.status === 500) {
            throw new Error('Server error. Please try again later.');
        }

        // Parse response
        const data = await response.json();

        // Check response success
        if (!data.success) {
            throw new Error(data.message || 'Request failed');
        }

        return data.data || data;

    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        throw error;
    }
}

// ============ COMMON API CALLS ============

/**
 * Get current user profile
 */
async function getCurrentUser() {
    try {
        const result = await apiRequest('/auth/me');
        return result.user || result;
    } catch (error) {
        console.error('Error getting current user:', error);
        throw error;
    }
}

/**
 * Get all equipment
 */
async function getEquipment(filters = {}) {
    try {
        let endpoint = '/equipment';
        const params = new URLSearchParams(filters);
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        const result = await apiRequest(endpoint);
        return result.data || result;
    } catch (error) {
        console.error('Error getting equipment:', error);
        throw error;
    }
}

/**
 * Get equipment by ID
 */
async function getEquipmentById(id) {
    try {
        const result = await apiRequest(`/equipment/${id}`);
        return result.data || result;
    } catch (error) {
        console.error(`Error getting equipment ${id}:`, error);
        throw error;
    }
}

/**
 * Create equipment
 */
async function createEquipment(data) {
    try {
        const result = await apiRequest('/equipment', 'POST', data);
        return result;
    } catch (error) {
        console.error('Error creating equipment:', error);
        throw error;
    }
}

/**
 * Update equipment
 */
async function updateEquipment(id, data) {
    try {
        const result = await apiRequest(`/equipment/${id}`, 'PUT', data);
        return result;
    } catch (error) {
        console.error(`Error updating equipment ${id}:`, error);
        throw error;
    }
}

/**
 * Delete equipment
 */
async function deleteEquipment(id) {
    try {
        const result = await apiRequest(`/equipment/${id}`, 'DELETE');
        return result;
    } catch (error) {
        console.error(`Error deleting equipment ${id}:`, error);
        throw error;
    }
}

/**
 * Get all users (admin only)
 */
async function getUsers(filters = {}) {
    try {
        let endpoint = '/users';
        const params = new URLSearchParams(filters);
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        const result = await apiRequest(endpoint);
        return result.data || result;
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
}

/**
 * Get user by ID (admin only)
 */
async function getUserById(id) {
    try {
        const result = await apiRequest(`/users/${id}`);
        return result.data || result;
    } catch (error) {
        console.error(`Error getting user ${id}:`, error);
        throw error;
    }
}

/**
 * Create user (admin only)
 */
async function createUser(data) {
    try {
        const result = await apiRequest('/users', 'POST', data);
        return result;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

/**
 * Update user (admin only)
 */
async function updateUser(id, data) {
    try {
        const result = await apiRequest(`/users/${id}`, 'PUT', data);
        return result;
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw error;
    }
}

/**
 * Delete user (admin only)
 */
async function deleteUser(id) {
    try {
        const result = await apiRequest(`/users/${id}`, 'DELETE');
        return result;
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        throw error;
    }
}

/**
 * Get all loans
 */
async function getLoans(filters = {}) {
    try {
        let endpoint = '/loans';
        const params = new URLSearchParams(filters);
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        const result = await apiRequest(endpoint);
        return result.data || result;
    } catch (error) {
        console.error('Error getting loans:', error);
        throw error;
    }
}

/**
 * Get loan by ID
 */
async function getLoanById(id) {
    try {
        const result = await apiRequest(`/loans/${id}`);
        return result.data || result;
    } catch (error) {
        console.error(`Error getting loan ${id}:`, error);
        throw error;
    }
}

/**
 * Create loan request
 */
async function createLoan(data) {
    try {
        const result = await apiRequest('/loans', 'POST', data);
        return result;
    } catch (error) {
        console.error('Error creating loan:', error);
        throw error;
    }
}

/**
 * Get pending loan approvals (admin/petugas only)
 */
async function getPendingApprovals() {
    try {
        const result = await apiRequest('/loans/pending-approvals');
        return result.data || result;
    } catch (error) {
        console.error('Error getting pending approvals:', error);
        throw error;
    }
}

/**
 * Approve loan (admin/petugas only)
 */
async function approveLoan(id, notes = '') {
    try {
        const result = await apiRequest(`/loans/${id}/approve`, 'POST', { notes });
        return result;
    } catch (error) {
        console.error(`Error approving loan ${id}:`, error);
        throw error;
    }
}

/**
 * Reject loan (admin/petugas only)
 */
async function rejectLoan(id, reason) {
    try {
        const result = await apiRequest(`/loans/${id}/reject`, 'POST', { rejection_reason: reason });
        return result;
    } catch (error) {
        console.error(`Error rejecting loan ${id}:`, error);
        throw error;
    }
}

/**
 * Return loan equipment
 */
async function returnLoan(id, notes = '') {
    try {
        const result = await apiRequest(`/loans/${id}/return`, 'POST', { notes });
        return result;
    } catch (error) {
        console.error(`Error returning loan ${id}:`, error);
        throw error;
    }
}

/**
 * Get all borrowers
 */
async function getBorrowers(filters = {}) {
    try {
        let endpoint = '/borrowers';
        const params = new URLSearchParams(filters);
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        const result = await apiRequest(endpoint);
        return result.data || result;
    } catch (error) {
        console.error('Error getting borrowers:', error);
        throw error;
    }
}

/**
 * Create borrower
 */
async function createBorrower(data) {
    try {
        const result = await apiRequest('/borrowers', 'POST', data);
        return result;
    } catch (error) {
        console.error('Error creating borrower:', error);
        throw error;
    }
}

/**
 * Get dashboard data
 */
async function getDashboardData() {
    try {
        const result = await apiRequest('/dashboard');
        return result.data || result;
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        throw error;
    }
}

/**
 * Get reports
 */
async function getReports(filters = {}) {
    try {
        let endpoint = '/reports';
        const params = new URLSearchParams(filters);
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        const result = await apiRequest(endpoint);
        return result.data || result;
    } catch (error) {
        console.error('Error getting reports:', error);
        throw error;
    }
}

// ============ PERMISSION HELPERS ============

/**
 * Check if user has specific role
 */
function hasRole(role) {
    const user = getUser();
    return user && user.role === role;
}

/**
 * Check if user is admin
 */
function isAdmin() {
    return hasRole('admin');
}

/**
 * Check if user is petugas
 */
function isPetugas() {
    return hasRole('petugas');
}

/**
 * Check if user is peminjam
 */
function isPeminjam() {
    return hasRole('peminjam');
}

/**
 * Check if user has any of the given roles
 */
function hasAnyRole(...roles) {
    const user = getUser();
    return user && roles.includes(user.role);
}

/**
 * Require authentication (redirect if not logged in)
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login-new';
        return false;
    }
    return true;
}

/**
 * Require specific role (redirect if wrong role)
 */
function requireRole(role) {
    if (!isAuthenticated()) {
        window.location.href = '/login-new';
        return false;
    }
    if (!hasRole(role)) {
        window.location.href = '/access-denied';
        return false;
    }
    return true;
}

/**
 * Require any of the given roles
 */
function requireAnyRole(...roles) {
    if (!isAuthenticated()) {
        window.location.href = '/login-new';
        return false;
    }
    if (!hasAnyRole(...roles)) {
        window.location.href = '/access-denied';
        return false;
    }
    return true;
}

// ============ FORMATTING HELPERS ============

/**
 * Format date to Indonesian format
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format datetime to Indonesian format
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format currency to Indonesian format
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(amount);
}

/**
 * Get role display name in Indonesian
 */
function getRoleDisplay(role) {
    const roles = {
        'admin': 'Admin',
        'petugas': 'Petugas',
        'peminjam': 'Peminjam'
    };
    return roles[role] || role;
}

/**
 * Get loan status display
 */
function getLoanStatusDisplay(status) {
    const statuses = {
        'pending': 'Menunggu Persetujuan',
        'approved': 'Disetujui',
        'active': 'Sedang Dipinjam',
        'returned': 'Dikembalikan',
        'rejected': 'Ditolak'
    };
    return statuses[status] || status;
}

/**
 * Get approval status display
 */
function getApprovalStatusDisplay(status) {
    const statuses = {
        'pending': 'Menunggu',
        'approved': 'Disetujui',
        'rejected': 'Ditolak'
    };
    return statuses[status] || status;
}

// ============ INITIALIZATION ============

/**
 * Initialize frontend on page load
 * Call this on every page to ensure proper setup
 */
function initializeFrontend() {
    // Check authentication
    if (!isAuthenticated()) {
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('login')) {
            window.location.href = '/login-new';
        }
        return false;
    }

    // Check token expiration
    if (isTokenExpired()) {
        clearAuth();
        window.location.href = '/login-new?expired=true';
        return false;
    }

    // Update user info display if element exists
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    
    if (userNameEl || userRoleEl) {
        const user = getUser();
        if (user) {
            if (userNameEl) userNameEl.textContent = user.name;
            if (userRoleEl) userRoleEl.textContent = getRoleDisplay(user.role);
        }
    }

    return true;
}

/**
 * Add logout button listener
 */
function setupLogoutButton(selector = '#logoutBtn') {
    const btn = document.querySelector(selector);
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Anda yakin ingin logout?')) {
                logout();
            }
        });
    }
}
