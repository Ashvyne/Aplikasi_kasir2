import React, { useState, useEffect } from 'react';
import {
  Settings, Store, Percent, Palette, User, Save, RotateCcw,
  Sun, Moon, Eye, EyeOff, CheckCircle, Bell, Shield
} from 'lucide-react';
import Swal from 'sweetalert2';

import { getSettings, saveSettings, defaultSettings, SETTINGS_KEY } from '../utils/settings';
import { authService } from '../services/api';

const TABS = [
  { id: 'store',      label: 'Toko',        icon: Store },
  { id: 'fees',       label: 'Pajak & Biaya', icon: Percent },
  { id: 'appearance', label: 'Tampilan',    icon: Palette },
  { id: 'account',    label: 'Akun',        icon: User },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }));
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPass, setChangingPass] = useState(false);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // Apply theme instantly
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    Swal.fire({ title: 'Tersimpan!', text: 'Pengaturan berhasil disimpan.', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Reset Pengaturan?',
      text: 'Semua pengaturan akan kembali ke default.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Reset!',
      cancelButtonText: 'Batal',
    });
    if (result.isConfirmed) {
      setSettings({ ...defaultSettings });
      localStorage.removeItem(SETTINGS_KEY);
      Swal.fire({ title: 'Direset!', icon: 'success', timer: 1200, showConfirmButton: false });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      return Swal.fire('Error', 'Password baru tidak cocok!', 'error');
    }
    if (passwords.newPass.length < 6) {
      return Swal.fire('Error', 'Password minimal 6 karakter.', 'error');
    }
    setChangingPass(true);
    try {
      await authService.changePassword(passwords.current, passwords.newPass);
      Swal.fire({ title: 'Berhasil!', text: 'Password berhasil diubah.', icon: 'success', timer: 1800, showConfirmButton: false });
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      const msg = err?.error || err?.message || 'Gagal mengubah password. Coba lagi.';
      Swal.fire('Gagal', msg, 'error');
    } finally {
      setChangingPass(false);
    }
  };

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-bg-darker border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent-gold transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings size={32} className="text-accent-gold" />
          Pengaturan
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow ${saved ? 'bg-green-500 text-white' : 'bg-accent-gold text-black hover:bg-yellow-400'}`}
          >
            {saved ? <><CheckCircle size={15} /> Tersimpan!</> : <><Save size={15} /> Simpan</>}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-bg-darker p-1 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-bg-light text-accent-gold shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card space-y-6">

        {/* ─── TOKO ─── */}
        {activeTab === 'store' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Store size={20} className="text-accent-gold" /> Informasi Toko</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Nama Toko</label>
                <input className={inputClass} value={settings.storeName} onChange={e => update('storeName', e.target.value)} placeholder="CaféPOS" />
              </div>
              <div>
                <label className={labelClass}>No. Telepon</label>
                <input className={inputClass} value={settings.storePhone} onChange={e => update('storePhone', e.target.value)} placeholder="+62 812 xxxx xxxx" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Deskripsi Toko (Slogan)</label>
                <input className={inputClass} value={settings.storeDescription} onChange={e => update('storeDescription', e.target.value)} placeholder="Premium Coffee & Eatery" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Alamat</label>
                <input className={inputClass} value={settings.storeAddress} onChange={e => update('storeAddress', e.target.value)} placeholder="Jl. Contoh No. 1, Kota" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={settings.storeEmail} onChange={e => update('storeEmail', e.target.value)} placeholder="toko@email.com" />
              </div>
              <div>
                <label className={labelClass}>Pesan Footer Struk</label>
                <input className={inputClass} value={settings.storeFooter} onChange={e => update('storeFooter', e.target.value)} placeholder="Terima kasih telah berkunjung!" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><Bell size={16} className="text-accent-gold" /> Notifikasi</h3>
              <div className="space-y-3">
                {[
                  { key: 'kitchenSound', label: 'Suara notifikasi pesanan baru masuk dapur' },
                  { key: 'orderAlerts', label: 'Alert pesanan selesai (Kitchen → Ready)' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-bg-darker cursor-pointer hover:bg-gray-100 dark:hover:bg-bg-light transition-colors">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <div
                      onClick={() => update(item.key, !settings[item.key])}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${settings[item.key] ? 'bg-accent-gold' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings[item.key] ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── PAJAK & BIAYA ─── */}
        {activeTab === 'fees' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Percent size={20} className="text-accent-gold" /> Pajak & Biaya Layanan</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Perubahan di sini akan diterapkan ke tampilan POS. Tarif di database backend (10% pajak, 5% servis) perlu diubah di kode untuk efek permanen.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">PPN (Pajak)</h3>
                  <div
                    onClick={() => update('taxEnabled', !settings.taxEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${settings.taxEnabled ? 'bg-accent-gold' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.taxEnabled ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tarif Pajak (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="30" step="0.5"
                      className={inputClass}
                      value={settings.taxRate}
                      onChange={e => update('taxRate', parseFloat(e.target.value) || 0)}
                      disabled={!settings.taxEnabled}
                    />
                    <span className="text-gray-500 font-bold text-lg">%</span>
                  </div>
                </div>
                <div className={`text-xs rounded-lg px-3 py-2 ${settings.taxEnabled ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {settings.taxEnabled ? `Pajak ${settings.taxRate}% akan ditambahkan ke setiap pesanan` : 'Pajak dinonaktifkan'}
                </div>
              </div>

              {/* Service Charge */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Biaya Layanan</h3>
                  <div
                    onClick={() => update('serviceChargeEnabled', !settings.serviceChargeEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${settings.serviceChargeEnabled ? 'bg-accent-gold' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.serviceChargeEnabled ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tarif Service Charge (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="20" step="0.5"
                      className={inputClass}
                      value={settings.serviceChargeRate}
                      onChange={e => update('serviceChargeRate', parseFloat(e.target.value) || 0)}
                      disabled={!settings.serviceChargeEnabled}
                    />
                    <span className="text-gray-500 font-bold text-lg">%</span>
                  </div>
                </div>
                <div className={`text-xs rounded-lg px-3 py-2 ${settings.serviceChargeEnabled ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {settings.serviceChargeEnabled ? `Biaya layanan ${settings.serviceChargeRate}% akan ditambahkan` : 'Biaya layanan dinonaktifkan'}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-xl p-4">
              <h3 className="font-bold text-accent-gold mb-2 text-sm">Contoh Kalkulasi</h3>
              <div className="text-sm space-y-1">
                {[
                  ['Subtotal', 'Rp 100.000'],
                  settings.taxEnabled && [`PPN ${settings.taxRate}%`, `Rp ${(100000 * settings.taxRate / 100).toLocaleString('id-ID')}`],
                  settings.serviceChargeEnabled && [`Layanan ${settings.serviceChargeRate}%`, `Rp ${(100000 * settings.serviceChargeRate / 100).toLocaleString('id-ID')}`],
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>{label}</span><span>{val}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-accent-gold/30 mt-1">
                  <span>Total</span>
                  <span className="text-accent-gold">
                    Rp {(100000 + (settings.taxEnabled ? 100000 * settings.taxRate / 100 : 0) + (settings.serviceChargeEnabled ? 100000 * settings.serviceChargeRate / 100 : 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── TAMPILAN ─── */}
        {activeTab === 'appearance' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Palette size={20} className="text-accent-gold" /> Tampilan Aplikasi</h2>

            <div>
              <label className={labelClass}>Mode Tampilan</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { value: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Latar belakang gelap, nyaman di malam hari' },
                  { value: 'light', label: 'Light Mode', icon: Sun, desc: 'Latar belakang terang, cocok untuk siang hari' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('theme', opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${settings.theme === opt.value ? 'border-accent-gold bg-accent-gold/10' : 'border-gray-200 dark:border-gray-700 hover:border-accent-gold/50'}`}
                  >
                    <opt.icon size={24} className={settings.theme === opt.value ? 'text-accent-gold mb-2' : 'text-gray-400 mb-2'} />
                    <p className={`font-bold text-sm ${settings.theme === opt.value ? 'text-accent-gold' : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 Klik <strong className="text-accent-gold">Simpan</strong> untuk menerapkan perubahan tampilan secara permanen. Perubahan mode akan langsung terlihat saat disimpan.
              </p>
            </div>
          </>
        )}

        {/* ─── AKUN ─── */}
        {activeTab === 'account' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield size={20} className="text-accent-gold" /> Keamanan Akun</h2>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/30 text-sm text-blue-700 dark:text-blue-400">
              Ganti password akun Anda di bawah ini. Minimal 6 karakter.
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              {[
                { key: 'current', label: 'Password Saat Ini', placeholder: '••••••••' },
                { key: 'newPass', label: 'Password Baru', placeholder: 'Min. 6 karakter' },
                { key: 'confirm', label: 'Konfirmasi Password Baru', placeholder: 'Ulangi password baru' },
              ].map(field => (
                <div key={field.key}>
                  <label className={labelClass}>{field.label}</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder={field.placeholder}
                      className={inputClass + ' pr-10'}
                      value={passwords[field.key]}
                      onChange={e => setPasswords(prev => ({ ...prev, [field.key]: e.target.value }))}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={changingPass} className="btn-primary flex items-center gap-2 px-6 disabled:opacity-60 disabled:cursor-not-allowed">
                {changingPass ? <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4" /> : <Shield size={16} />}
                {changingPass ? 'Menyimpan...' : 'Ubah Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
