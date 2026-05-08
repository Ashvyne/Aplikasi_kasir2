import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Shield, Mail, 
  User as UserIcon, Check, X, ShieldAlert, Key, ChefHat, ShoppingCart
} from 'lucide-react';
import Swal from 'sweetalert2';
import { userService } from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll();
      if (res.success) setUsers(res.users);
    } catch (err) {
      Swal.fire('Error', 'Gagal memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email,
        password: '', // Password empty when editing
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'admin'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await userService.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        if (res.success) {
          Swal.fire('Berhasil', 'User diperbarui', 'success');
          setShowModal(false);
          fetchUsers();
        }
      } else {
        const res = await userService.register(formData);
        if (res.success) {
          Swal.fire('Berhasil', 'User baru dibuat', 'success');
          setShowModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      Swal.fire('Gagal', err.message || 'Terjadi kesalahan', 'error');
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: 'Hapus User?',
      text: `Anda yakin ingin menghapus user ${user.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const res = await userService.delete(user.id);
        if (res.success) {
          Swal.fire('Terhapus!', 'User berhasil dihapus.', 'success');
          fetchUsers();
        }
      } catch (err) {
        Swal.fire('Gagal', err.message || 'Gagal menghapus user', 'error');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
      cashier: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      kitchen: 'bg-green-500/10 text-green-500 border-green-500/20',
      customer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    
    const icons = {
      admin: <ShieldAlert size={14} />,
      cashier: <ShoppingCart size={14} />,
      kitchen: <ChefHat size={14} />,
      customer: <UserIcon size={14} />,
    };

    return (
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[role] || styles.customer}`}>
        {icons[role]}
        {role.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users size={32} className="text-accent-gold" />
            Manajemen Pengguna
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola hak akses admin, kasir, dan staf dapur.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-accent-gold/20"
        >
          <UserPlus size={20} />
          Tambah User
        </button>
      </div>

      {/* Toolbar */}
      <div className="card flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama, username, atau email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-accent-gold transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent-gold"></div> {users.length} Total User</span>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border border-gray-200 dark:border-gray-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-bg-light/30 border-b border-gray-200 dark:border-gray-700/50">
                <th className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Pengguna</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role / Akses</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Terdaftar</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    Tidak ada user ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-bg-light/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 italic">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail size={14} className="text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-bg-dark rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-bg-light/30">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {editingUser ? <Edit2 size={20} className="text-accent-gold" /> : <UserPlus size={20} className="text-accent-gold" />}
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    required
                    disabled={!!editingUser}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-accent-gold disabled:opacity-50 transition-colors"
                    placeholder="Contoh: admin_staf"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-accent-gold transition-colors"
                  placeholder="Nama lengkap user"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email" 
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-accent-gold transition-colors"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="password" 
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-accent-gold transition-colors"
                      placeholder="Min. 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Role / Hak Akses</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'admin', label: 'Admin', icon: Shield },
                    { id: 'cashier', label: 'Kasir', icon: ShoppingCart },
                    { id: 'kitchen', label: 'Dapur', icon: ChefHat },
                    { id: 'customer', label: 'Customer', icon: UserIcon },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({...formData, role: role.id})}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.role === role.id 
                          ? 'border-accent-gold bg-accent-gold/10 text-accent-gold' 
                          : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:border-accent-gold/30'
                      }`}
                    >
                      <role.icon size={16} />
                      <span className="text-sm font-bold">{role.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
                  💡 <b>Admin</b> punya akses penuh ke Dashboard, POS, & Dapur.<br/>
                  💡 <b>Kasir</b> hanya akses Dashboard & POS.<br/>
                  💡 <b>Dapur</b> hanya akses monitoring pesanan.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-bg-light transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-accent-gold text-black font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20"
                >
                  <Check size={18} />
                  {editingUser ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
