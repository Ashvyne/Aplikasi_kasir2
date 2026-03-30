import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, Menu, User, Clock, Sun, Moon, LogOut, ChevronRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/api';

function useClickOutside(ref, callback) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) callback();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

export default function Header({ onMenuClick }) {
  const [now, setNow] = useState(new Date());
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown states
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(notifRef, () => setShowNotif(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch recent orders when notification opens
  const handleBellClick = async () => {
    setShowProfile(false);
    setShowNotif(prev => !prev);
    if (!showNotif) {
      try {
        setNotifLoading(true);
        const res = await orderService.getAll({ limit: 5, status: 'pending,cooking,ready' });
        const data = res?.data?.orders || res?.data || res || [];
        setRecentOrders(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setRecentOrders([]);
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const statusColors = {
    pending: 'bg-yellow-400',
    cooking: 'bg-orange-400',
    ready: 'bg-green-400',
    served: 'bg-blue-400',
    completed: 'bg-gray-400',
  };

  const statusLabels = {
    pending: 'Menunggu',
    cooking: 'Masak',
    ready: 'Siap',
    served: 'Disajikan',
    completed: 'Selesai',
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gradient-to-r dark:from-bg-darker dark:to-bg-dark border-b border-gray-200 dark:border-gray-700/30 backdrop-blur-lg transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left - Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors"
        >
          <Menu size={24} className="text-accent-gold" />
        </button>

        {/* Center - Time */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          <Clock size={16} />
          <span>{now.toLocaleTimeString('id-ID')} · {now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Right - Icons */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark'
              ? <Sun size={20} className="text-gray-400 group-hover:text-accent-gold transition-colors" />
              : <Moon size={20} className="text-gray-500 group-hover:text-accent-gold transition-colors" />}
          </button>

          {/* Notifications Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group"
              title="Notifikasi"
            >
              <Bell size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-accent-gold transition-colors" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-bg-darker border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Pesanan Aktif</h3>
                  <button onClick={() => { navigate('/pos'); setShowNotif(false); }} className="text-xs text-accent-gold hover:underline">Lihat Semua</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-gold" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <CheckCircle size={32} className="mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm">Tidak ada pesanan aktif</p>
                    </div>
                  ) : (
                    recentOrders.map(order => (
                      <div key={order.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-bg-light transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                        onClick={() => { navigate('/pos'); setShowNotif(false); }}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColors[order.status] || 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.customerName || 'Pelanggan'} · {order.table?.tableName || 'Take Away'}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${statusColors[order.status] || 'bg-gray-400'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group"
            title="Pengaturan"
          >
            <Settings size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-accent-gold transition-colors" />
          </button>

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setShowNotif(false); setShowProfile(prev => !prev); }}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group"
              title="Profil"
            >
              <div className="w-7 h-7 rounded-full bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center">
                <User size={16} className="text-accent-gold" />
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-bg-darker border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-accent-gold/5">
                  <div className="w-10 h-10 rounded-full bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center mb-2">
                    <User size={20} className="text-accent-gold" />
                  </div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-accent-gold capitalize">{user?.role || 'admin'}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button onClick={() => { navigate('/settings?tab=account'); setShowProfile(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-bg-light hover:text-accent-gold transition-colors">
                    <div className="flex items-center gap-2"><ShieldCheck size={15} /> Keamanan Akun</div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </button>
                  <button onClick={() => { navigate('/settings'); setShowProfile(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-bg-light hover:text-accent-gold transition-colors">
                    <div className="flex items-center gap-2"><Settings size={15} /> Pengaturan</div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
