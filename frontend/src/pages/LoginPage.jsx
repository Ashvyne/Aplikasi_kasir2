import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Loader } from 'lucide-react';
import { authService } from '../services/api';
import { useAuthStore } from '../context/store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);

      // Backend returns: { success: true, message, token, sessionId, user }
      if (response.success && response.token && response.user) {
        const { user, token } = response;
        setAuth(user, token);
        localStorage.setItem('token', token);
        localStorage.setItem('sessionId', response.sessionId);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-darker to-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-accent-green/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-accent-gold/20 rounded-lg">
                <UtensilsCrossed size={32} className="text-accent-gold" />
              </div>
            </div>
            <h1 className="text-3xl font-poppins font-bold text-white mb-2">
              CaféPOS
            </h1>
            <p className="text-gray-400 text-sm">
              Sistem POS Modern untuk Cafe & Restoran
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="input-base"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="input-base"
                disabled={loading}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400 hover:text-gray-300 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-700" />
                Remember me
              </label>
              <a href="#" className="text-accent-gold hover:text-accent-yellow transition">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>


        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          CaféPOS © 2024 - Professional POS System
        </p>
      </div>
    </div>
  );
}
