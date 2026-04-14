import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function CustomerRegister() {
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await api.post('/auth/register', { ...formData, role: 'customer' });

      if (data.success) {
        setSuccess('Pendaftaran berhasil! Mengalihkan...');
        setTimeout(() => navigate('/customer/login'), 2000);
      } else {
        setError(data.error || data.message || 'Pendaftaran gagal');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.error || err.message || 'Koneksi jaringan bermasalah.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden -z-10 bg-gradient-to-br from-[#EEF2FF] to-white dark:from-bg-darker dark:to-black">
         <div className="absolute top-1/4 -right-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
         <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent-gold/20 dark:bg-accent-gold/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white dark:bg-bg-dark text-blue-600 dark:text-blue-400 mb-4 shadow-xl border border-gray-100 dark:border-gray-800">
            <UtensilsCrossed size={28} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Buat Akun</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Hanya butuh 30 detik untuk mulai.</p>
        </div>

        <div className="bg-white/90 dark:bg-bg-dark/90 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-8 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm font-semibold flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30 rounded-2xl text-sm font-bold flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Nama Tampilan</label>
              <input type="text" name="name" required className="w-full px-5 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-bg-darker focus:bg-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 dark:text-white rounded-xl transition-all" placeholder="Panggil saya..." onChange={handleChange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Username Login</label>
              <input type="text" name="username" required minLength="3" className="w-full px-5 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-bg-darker focus:bg-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 dark:text-white rounded-xl transition-all" placeholder="username_unik" onChange={handleChange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Alamat Email</label>
              <input type="email" name="email" required className="w-full px-5 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-bg-darker focus:bg-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 dark:text-white rounded-xl transition-all" placeholder="email@contoh.com" onChange={handleChange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Kata Sandi Rahasia</label>
              <input type="password" name="password" required minLength="6" className="w-full px-5 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-bg-darker focus:bg-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 dark:text-white rounded-xl transition-all" placeholder="••••••••" onChange={handleChange} />
            </div>
            
            <button type="submit" disabled={loading} className="group w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Daftar...</span>
                </>
              ) : (
                <>
                  <span>Registrasi Sekarang</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 font-medium pb-8">
          Sudah terdaftar?{' '}
          <Link to="/customer/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 focus:underline font-black ml-1">
            Masuk ke Akun
          </Link>
        </p>
      </div>
    </div>
  );
}
