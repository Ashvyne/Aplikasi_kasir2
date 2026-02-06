// Template untuk membuat dashboard dengan Tailwind + Darkmode
// Gunakan script ini untuk generate semua dashboard files

const dashboards = {
  manager: {
    title: "Manager Dashboard",
    role: "manager",
    icon: "bi-briefcase",
    avatar: "M",
    subtitle: "Manager",
    menus: [
      { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
      { id: 'reports', label: 'Laporan', icon: 'bi-file-earmark-bar-graph' },
      { id: 'staff', label: 'Kelola Staff', icon: 'bi-people' },
      { id: 'finance', label: 'Keuangan', icon: 'bi-cash-coin' }
    ]
  },
  cashier: {
    title: "Cashier Dashboard",
    role: "cashier",
    icon: "bi-cash-coin",
    avatar: "C",
    subtitle: "Cashier",
    menus: [
      { id: 'transactions', label: 'Transaksi', icon: 'bi-cash-coin' },
      { id: 'payment', label: 'Pembayaran', icon: 'bi-credit-card' },
      { id: 'reports', label: 'Laporan Hari Ini', icon: 'bi-file-earmark-bar-graph' }
    ]
  },
  supervisor: {
    title: "Supervisor Dashboard",
    role: "supervisor",
    icon: "bi-clipboard-check",
    avatar: "S",
    subtitle: "Supervisor",
    menus: [
      { id: 'quality', label: 'Quality Control', icon: 'bi-clipboard-check' },
      { id: 'inventory', label: 'Inventory', icon: 'bi-boxes' },
      { id: 'issues', label: 'Laporan Masalah', icon: 'bi-exclamation-triangle' },
      { id: 'team', label: 'Tim', icon: 'bi-people' }
    ]
  },
  staff: {
    title: "Staff Dashboard",
    role: "staff",
    icon: "bi-person-badge",
    avatar: "ST",
    subtitle: "Staff",
    menus: [
      { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
      { id: 'loans', label: 'Peminjaman', icon: 'bi-journal-check' },
      { id: 'returns', label: 'Pengembalian', icon: 'bi-box-arrow-right' }
    ]
  },
  borrower: {
    title: "Borrower Dashboard",
    role: "borrower",
    icon: "bi-person",
    avatar: "B",
    subtitle: "Peminjam",
    menus: [
      { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
      { id: 'myloans', label: 'Peminjaman Saya', icon: 'bi-journal' },
      { id: 'history', label: 'Riwayat', icon: 'bi-clock-history' }
    ]
  }
};
