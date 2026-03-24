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
      return 'bg-accent-green text-white';
    case 'occupied':
      return 'bg-red-600 text-white';
    case 'reserved':
      return 'bg-accent-gold text-black';
    default:
      return 'bg-gray-600 text-white';
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
