// Utility functions for formatting and calculations
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const calculateOrderTotals = (items, taxRate = 0.1, serviceChargeRate = 0.05) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * taxRate;
  const serviceCharge = subtotal * serviceChargeRate;
  const total = subtotal + taxAmount + serviceCharge;
  
  return {
    subtotal,
    taxAmount,
    serviceCharge,
    total,
  };
};

export const calculateChange = (totalAmount, paidAmount) => {
  return Math.max(0, paidAmount - totalAmount);
};

export const getTableStatusColor = (status) => {
  switch (status) {
    case 'available':
      return 'border-l-4 border-l-green-500';
    case 'occupied':
      return 'border-l-4 border-l-red-500';
    case 'reserved':
      return 'border-l-4 border-l-yellow-400';
    case 'cleaning':
      return 'border-l-4 border-l-orange-500';
    default:
      return 'border-l-4 border-l-gray-500';
  }
};

export const getTableStatusLabel = (status) => {
  switch (status) {
    case 'available':
      return 'Tersedia';
    case 'occupied':
      return 'Terisi';
    case 'reserved':
      return 'Reservasi';
    case 'cleaning':
      return 'Proses Pembersihan';
    default:
      return status;
  }
};

export const getOrderStatusLabel = (status) => {
  const labels = {
    'pending': 'Menunggu Konfirmasi',
    'confirmed': 'Dikonfirmasi',
    'cooking': 'Sedang Masak',
    'ready': 'Siap Disajikan',
    'served': 'Sudah Disajikan',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
  };
  return labels[status] || status;
};

export const getOrderStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-600';
    case 'confirmed':
      return 'bg-blue-600';
    case 'cooking':
      return 'bg-orange-600';
    case 'ready':
      return 'bg-accent-green';
    case 'served':
      return 'bg-accent-emerald';
    case 'completed':
      return 'bg-green-700';
    case 'cancelled':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
};

export const getKitchenStatusLabel = (status) => {
  const labels = {
    'pending': 'Antri',
    'cooking': 'Masak',
    'ready': 'Siap',
    'delivered': 'Selesai',
  };
  return labels[status] || status;
};

/**
 * Resolves a product image URL to an absolute URL.
 * Handles: full URLs (http/https), relative paths (/uploads/...), and null/empty.
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  // Already an absolute URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Relative path — prefix with backend URL
  const backendUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:3000';
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${backendUrl}${path}`;
};
