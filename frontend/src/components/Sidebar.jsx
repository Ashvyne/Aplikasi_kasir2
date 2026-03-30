import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleMenu = (menu) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'POS / Pesanan',
      path: '/pos',
      icon: ShoppingCart,
      badge: 'new',
    },
    {
      label: 'Meja',
      path: '/tables',
      icon: UtensilsCrossed,
    },
    {
      label: 'Dapur',
      path: '/kitchen',
      icon: ChefHat,
    },
    {
      label: 'Menu',
      icon: Settings,
      submenu: [
        { label: 'Kategori', path: '/menu/categories' },
        { label: 'Produk', path: '/menu/products' },
      ],
    },
    {
      label: 'Laporan',
      path: '/reports',
      icon: BarChart3,
    },
    {
      label: 'Riwayat Transaksi',
      path: '/transactions',
      icon: FileText,
    },
    {
      label: 'Pengaturan',
      path: '/settings',
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gradient-to-b dark:from-bg-darker dark:to-bg-dark border-r border-gray-200 dark:border-gray-700/30 backdrop-blur-lg z-40 transform transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700/30">
          <h1 className="text-2xl font-poppins font-bold text-accent-gold flex items-center gap-2">
            <UtensilsCrossed size={28} />
            CaféPOS
          </h1>
          <button
            onClick={onClose}
            className="md:hidden absolute right-6 top-6 text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700/30">
          <div className="bg-gray-100 dark:bg-bg-light rounded-lg p-3 transition-colors duration-200">
            <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="text-gray-900 dark:text-white font-semibold">{user?.name || 'Admin'}</p>
            <p className="text-xs text-accent-gold capitalize">{user?.role || 'admin'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, idx) => (
            <div key={idx}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-bg-light hover:text-accent-gold dark:hover:text-accent-gold transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {expandedMenu === item.label ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {expandedMenu === item.label && (
                    <div className="ml-6 mt-2 space-y-1 border-l border-gray-200 dark:border-gray-700/30 pl-4">
                      {item.submenu.map((subitem, subidx) => (
                        <NavLink
                          key={subidx}
                          to={subitem.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `block text-sm p-2 rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'bg-accent-gold text-black font-semibold'
                                : 'text-gray-500 dark:text-gray-400 hover:text-accent-gold dark:hover:text-accent-gold'
                            }`
                          }
                        >
                          {subitem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 relative ${
                      isActive
                        ? 'bg-accent-gold text-black font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-bg-light hover:text-accent-gold'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-all duration-200 font-semibold"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
