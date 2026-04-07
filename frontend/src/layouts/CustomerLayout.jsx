import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar Akun?',
      text: 'Yakin mau keluar dari pelanggan CafePOS?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      customClass: {
        confirmButton: 'font-bold',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/customer/login');
      }
    });
  };

  // Auto scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">
      
      {/* Premium Header */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900">
        <div className="flex flex-row items-center gap-2">
          <div className="bg-black dark:bg-white text-white dark:text-black p-1.5 rounded-lg">
             <UtensilsCrossed size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase">CaféPOS</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 bg-gray-50 dark:bg-bg-dark px-3 py-1.5 rounded-full border border-gray-200/50 dark:border-gray-800">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
            {user ? `Hai, ${user.name?.split(' ')[0] || user.username}` : 'Hai, Pelanggan'}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 flex items-center gap-1.5 bg-white dark:bg-black text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 font-bold border border-gray-100 dark:border-gray-800"
            title="Log Out"
          >
            <LogOut size={14} />
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto flex flex-col relative items-center justify-start overflow-x-hidden shadow-[0_0_80px_rgba(0,0,0,0.05)] dark:shadow-none bg-gray-50 dark:bg-black min-h-screen border-x-0 sm:border-x border-gray-100 dark:border-gray-900">
        {children}
      </main>
    </div>
  );
}
