import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // If sending FormData, we MUST delete the Content-Type header
  // so the browser can automatically set it with the correct boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error.response?.data || error.message;
  }
);

// ============ AUTH API ============
export const authService = {
  login: (username, password) => api.post('/auth/login', { 
    username, 
    password,
    requiredRole: 'admin_kasir'  // Role required by backend
  }),
  logout: () => {
    localStorage.removeItem('token');
  },
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// ============ DASHBOARD API ============
export const dashboardService = {
  getSummary: () => api.get('/analytics/summary'),
  getRevenueAnalytics: (period) => api.get(`/analytics/revenue/analytics?period=${period}`),
  getHourlyRevenue: () => api.get('/analytics/revenue/hourly'),
  getTopSellingItems: (period, limit) => api.get(`/analytics/products/top-selling?period=${period}&limit=${limit}`),
  getPaymentDistribution: (period) => api.get(`/analytics/payments/distribution?period=${period}`),
  getOrderTypeDistribution: (period) => api.get(`/analytics/orders/type-distribution?period=${period}`),
  getCustomerStats: (period) => api.get(`/analytics/customers/stats?period=${period}`),
  getRecentOrders: (limit) => api.get(`/analytics/orders/recent?limit=${limit}`),
  getDetailedReport: (startDate, endDate) => 
    api.get(`/analytics/reports/detailed?startDate=${startDate}&endDate=${endDate}`),
};

// ============ TABLES API ============
export const tableService = {
  getAll: () => api.get('/tables'),
  getStats: () => api.get('/tables/stats/summary'),
  getById: (id) => api.get(`/tables/${id}`),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  delete: (id) => api.delete(`/tables/${id}`),
  bulkCreate: (count, capacity, location) => 
    api.post('/tables/bulk/create', { count, capacityPerTable: capacity, location }),
};

// ============ CATEGORIES API ============
export const categoryService = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  reorder: (categories) => api.post('/categories/reorder/all', { categories }),
};

// ============ PRODUCTS API ============
export const productService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (query) => api.get(`/products?search=${query}`),
};

// ============ ORDERS API ============
export const orderService = {
  getAll: (filters) => api.get('/orders', { params: filters }),
  getToday: () => api.get('/orders/today/list'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  addItem: (orderId, data) => api.post(`/orders/${orderId}/items`, data),
  updateItem: (orderId, itemId, data) => api.put(`/orders/${orderId}/items/${itemId}`, data),
  removeItem: (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`),
  processPayment: (orderId, data) => api.post(`/orders/${orderId}/payment`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

// ============ KITCHEN API ============
export const kitchenService = {
  getActive: () => api.get('/kitchen/active/list'),
  getUrgent: () => api.get('/kitchen/urgent/list'),
  getStats: () => api.get('/kitchen/stats/summary'),
  updateStatus: (orderId, status) => api.patch(`/kitchen/${orderId}/status`, { status }),
  updateItemStatus: (orderId, itemId, status) => 
    api.patch(`/kitchen/${orderId}/items/${itemId}/status`, { status }),
  startCooking: (orderId) => api.patch(`/kitchen/${orderId}/start-cooking`),
  complete: (orderId) => api.patch(`/kitchen/${orderId}/complete`),
};

export default api;
