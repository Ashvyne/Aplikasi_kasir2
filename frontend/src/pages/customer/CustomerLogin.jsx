import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Coffee, ChevronRight, Loader2 } from 'lucide-react';

export default function CustomerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.user.role !== 'customer') {
          setError('Hanya pelanggan yang dapat masuk ke area ini.');
          return;
        }
        localStorage.setItem('token', data.token);
        setAuth(data.user, data.token);
        navigate('/customer/menu');
      } else {
        setError(data.error || data.message || 'Login gagal.');
      }
    } catch (err) {
      setError('Koneksi jaringan bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-gradient-to-br from-[#FEF3C7] to-white dark:from-bg-darker dark:to-black">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent-gold/20 dark:bg-accent-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-white to-transparent dark:from-black dark:to-transparent" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-gold to-yellow-300 text-bg-darker mb-4 shadow-xl shadow-accent-gold/20 transform rotate-[-10deg]">
            <Coffee size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Selamat Datang 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Masuk untuk mulai memesan makanan.</p>
        </div>

        <div className="bg-white/80 dark:bg-bg-dark/80 backdrop-blur-xl border border-white/50 dark:border-gray-800 p-8 rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm font-semibold flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Username</label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 border-none bg-gray-50/50 hover:bg-gray-100 focus:bg-white dark:bg-bg-darker/50 dark:hover:bg-bg-darker focus:ring-2 focus:ring-accent-gold dark:text-white rounded-2xl transition-all shadow-inner"
                placeholder="cth: andi_123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Kata Sandi</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 border-none bg-gray-50/50 hover:bg-gray-100 focus:bg-white dark:bg-bg-darker/50 dark:hover:bg-bg-darker focus:ring-2 focus:ring-accent-gold dark:text-white rounded-2xl transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full mt-8 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 dark:from-accent-gold dark:to-yellow-500 dark:text-black text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-xl dark:shadow-accent-gold/20 flex items-center justify-center gap-2 relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
          Belum punya akun?{' '}
          <Link to="/customer/register" className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-orange-500 hover:opacity-80 transition font-black ml-1">
            Daftar Gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
