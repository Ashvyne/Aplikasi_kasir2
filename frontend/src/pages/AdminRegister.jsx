import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, CheckCircle2, User, Mail, Lock, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function AdminRegister() {
  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    email: '', 
    password: '',
    adminSecret: '' // Optional security field if you want to prevent anyone from registering as admin
  });
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
      // We force role: 'admin' here
      const data = await api.post('/auth/register', { ...formData, role: 'admin' });

      if (data.success) {
        setSuccess('Akun Admin berhasil dibuat! Mengalihkan ke Login...');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(data.error || data.message || 'Pendaftaran gagal');
      }
    } catch (err) {
      setError(err.error || err.message || 'Gagal mendaftarkan admin. Username/Email mungkin sudah terpakai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden bg-white dark:bg-bg-dark">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden -z-10 bg-gray-50 dark:bg-bg-darker">
         <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent-gold/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent-gold/10 text-accent-gold mb-4 border-2 border-accent-gold/20 shadow-xl shadow-accent-gold/10">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight font-poppins">Admin Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Buat akun administrator baru untuk sistem kasir.</p>
        </div>

        <div className="bg-white dark:bg-bg-dark/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm font-semibold flex items-center gap-3">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30 rounded-2xl text-sm font-bold flex items-center gap-3 animate-bounce">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-bg-darker focus:bg-white dark:focus:bg-bg-light focus:ring-2 focus:ring-accent-gold dark:text-white rounded-2xl transition-all outline-none" 
                  placeholder="Contoh: Manager Toko" 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username Login</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  name="username" 
                  required 
                  className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-bg-darker focus:bg-white dark:focus:bg-bg-light focus:ring-2 focus:ring-accent-gold dark:text-white rounded-2xl transition-all outline-none" 
                  placeholder="admin_keren" 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Administrator</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  name="email" 
                  required 
                  className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-bg-darker focus:bg-white dark:focus:bg-bg-light focus:ring-2 focus:ring-accent-gold dark:text-white rounded-2xl transition-all outline-none" 
                  placeholder="admin@cafe.pos" 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password Keamanan</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  name="password" 
                  required 
                  minLength={6}
                  className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-bg-darker focus:bg-white dark:focus:bg-bg-light focus:ring-2 focus:ring-accent-gold dark:text-white rounded-2xl transition-all outline-none" 
                  placeholder="••••••••" 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="group w-full mt-4 bg-gray-900 dark:bg-white dark:text-black text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20 dark:shadow-white/10"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Mendaftarkan Admin...</span>
                </>
              ) : (
                <>
                  <span>DAFTAR SEBAGAI ADMIN</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 font-medium pb-8">
          Ingin masuk ke sistem?{' '}
          <Link to="/login" className="text-accent-gold hover:underline font-black ml-1">
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}
