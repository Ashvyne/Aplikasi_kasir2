import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, LayoutGrid, List, Upload, Image as ImageIcon, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService, categoryService, API_BASE } from '../services/api';
import { formatCurrency, getImageUrl } from '../utils/helpers';
import NumericInput from '../components/NumericInput';
import Swal from 'sweetalert2';

export default function MenuPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({ name: '', sku: '', category: '', buy_price: 0, sell_price: 0, stock: 0, image_url: '', imageFile: null, imagePreview: null });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', color: '#FFD700' });

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname.includes('/categories')) setActiveTab('categories');
    else if (location.pathname.includes('/products')) setActiveTab('products');
  }, [location.pathname]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    navigate(`/menu/${tabName}`);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      // Universal data extractor to handle any backend response format
      let finalProducts = [];
      if (Array.isArray(prodRes)) finalProducts = prodRes;
      else if (prodRes?.products && Array.isArray(prodRes.products)) finalProducts = prodRes.products;
      else if (prodRes?.data?.products && Array.isArray(prodRes.data.products)) finalProducts = prodRes.data.products;
      else if (prodRes?.data && Array.isArray(prodRes.data)) finalProducts = prodRes.data;
      
      let finalCategories = [];
      if (Array.isArray(catRes)) finalCategories = catRes;
      else if (catRes?.categories && Array.isArray(catRes.categories)) finalCategories = catRes.categories;
      else if (catRes?.data?.categories && Array.isArray(catRes.data.categories)) finalCategories = catRes.data.categories;
      else if (catRes?.data && Array.isArray(catRes.data)) finalCategories = catRes.data;

      setProducts(finalProducts);
      setCategories(finalCategories);
    } catch (error) {
      console.error('Error loading menu data:', error);
      Swal.fire('Error', 'Gagal memuat data menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ================= PRODUCTS =================
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingItem(product);
      setProductForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        stock: product.stock,
        image_url: product.image_url || '',
        imageFile: null,
        imagePreview: null
      });
    } else {
      setEditingItem(null);
      setProductForm({ name: '', sku: '', category: categories[0]?.id || '', buy_price: 0, sell_price: 0, stock: 0, image_url: '', imageFile: null, imagePreview: null });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('sku', productForm.sku);
      formData.append('category', productForm.category);
      formData.append('buy_price', productForm.buy_price);
      formData.append('sell_price', productForm.sell_price);
      formData.append('stock', productForm.stock);
      if (productForm.imageFile) {
        formData.append('image', productForm.imageFile);
      }

      if (editingItem) {
        await productService.update(editingItem.id, formData);
        Swal.fire('Sukses', 'Produk berhasil diupdate', 'success');
      } else {
        await productService.create(formData);
        Swal.fire('Sukses', 'Produk berhasil ditambahkan', 'success');
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (error) {
      Swal.fire('Error', error.message || 'Gagal menyimpan produk', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      text: "Data tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      try {
        await productService.delete(id);
        Swal.fire('Terhapus!', 'Produk telah dihapus.', 'success');
        loadData();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus produk', 'error');
      }
    }
  };

  // ================= CATEGORIES =================
  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingItem(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#FFD700'
      });
    } else {
      setEditingItem(null);
      setCategoryForm({ name: '', description: '', icon: '', color: '#FFD700' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await categoryService.update(editingItem.id, categoryForm);
        Swal.fire('Sukses', 'Kategori berhasil diupdate', 'success');
      } else {
        await categoryService.create(categoryForm);
        Swal.fire('Sukses', 'Kategori berhasil ditambahkan', 'success');
      }
      setIsCategoryModalOpen(false);
      loadData();
    } catch (error) {
      Swal.fire('Error', error.message || 'Gagal menyimpan kategori', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Kategori?',
      text: "Data tidak dapat dikembalikan dan produk terkait mungkin kehilangan kategorinya!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      try {
        await categoryService.delete(id);
        Swal.fire('Terhapus!', 'Kategori telah dihapus.', 'success');
        loadData();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus kategori', 'error');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white transition-colors">Menu Management</h1>
        <div className="flex bg-gray-100 dark:bg-bg-darker rounded-lg p-1 transition-colors">
          <button
            onClick={() => handleTabChange('products')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              activeTab === 'products' ? 'bg-accent-gold text-black font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Package size={18} /> Produk
          </button>
          <button
            onClick={() => handleTabChange('categories')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              activeTab === 'categories' ? 'bg-accent-gold text-black font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid size={18} /> Kategori
          </button>
        </div>
      </div>
      
      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Daftar Produk</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari produk (Nama / SKU)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-full relative z-10"
                />
              </div>
              <button onClick={() => handleOpenProductModal()} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                <Plus size={18} /> Tambah Produk
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                  <th className="py-3 px-4 font-medium">SKU</th>
                  <th className="py-3 px-4 font-medium">Nama</th>
                  <th className="py-3 px-4 font-medium">Kategori</th>
                  <th className="py-3 px-4 font-medium">Harga Jual</th>
                  <th className="py-3 px-4 font-medium">Stok</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-gray-500">Produk tidak ditemukan</td></tr>
                ) : (
                  filteredProducts.map(product => {
                    const catName = categories.find(c => c.id.toString() === product.category)?.name || product.category;
                    return (
                      <tr key={product.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm text-gray-500 dark:text-gray-400 transition-colors">{product.sku}</td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 dark:bg-bg-darker flex-shrink-0 flex items-center justify-center">
                              {product.image_url ? (
                                <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" onError={(e)=>{e.target.style.display='none';}} />
                              ) : (
                                <ImageIcon size={20} className="text-gray-400" />
                              )}
                            </div>
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded transition-colors">{catName}</span>
                        </td>
                        <td className="py-3 px-4 text-accent-gold">{formatCurrency(product.sell_price)}</td>
                        <td className="py-3 px-4">
                          <span className={`${product.stock <= 5 ? 'text-red-400 font-bold' : 'text-accent-green'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleOpenProductModal(product)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded mr-2">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Daftar Kategori</h2>
            <button onClick={() => handleOpenCategoryModal()} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Tambah Kategori
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                  <th className="py-3 px-4 font-medium">Nama Kategori</th>
                  <th className="py-3 px-4 font-medium">Deskripsi</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan="3" className="text-center py-4 text-gray-500">Belum ada kategori</td></tr>
                ) : (
                  categories.map(category => (
                    <tr key={category.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color || '#FFD700' }}></div>
                        {category.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 transition-colors">{category.description || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleOpenCategoryModal(category)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded mr-2">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-xl p-6 shadow-2xl transition-colors">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white transition-colors">{editingItem ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Nama Produk</label>
                    <input type="text" required className="input-field" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">SKU</label>
                    <input type="text" required className="input-field" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Kategori</label>
                    <select required className="input-field" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id.toString()}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Upload Area */}
                <div className="space-y-2 flex flex-col">
                  <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Foto Produk</label>
                  <label className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-gold transition-colors relative overflow-hidden bg-gray-50 dark:bg-bg-dark">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setProductForm({
                            ...productForm, 
                            imageFile: file,
                            imagePreview: URL.createObjectURL(file)
                          });
                        }
                      }} 
                    />
                    {productForm.imagePreview || productForm.image_url ? (
                      <>
                        <img 
                          src={productForm.imagePreview || getImageUrl(productForm.image_url)} 
                          alt="Preview" 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white flex items-center gap-2"><Upload size={18}/> Ganti Foto</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                        <span className="text-gray-500 text-sm">Klik untuk upload foto</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Harga Beli</label>
                  <NumericInput 
                    value={productForm.buy_price} 
                    onChange={val => setProductForm({...productForm, buy_price: val})} 
                    prefix="Rp"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Harga Jual</label>
                  <NumericInput 
                    value={productForm.sell_price} 
                    onChange={val => setProductForm({...productForm, sell_price: val})} 
                    prefix="Rp"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Stok Awal</label>
                  <NumericInput 
                    value={productForm.stock} 
                    onChange={val => setProductForm({...productForm, stock: val})} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Batal</button>
                <button type="submit" className="btn-primary px-6">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl transition-colors">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white transition-colors">{editingItem ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Nama Kategori</label>
                <input type="text" required className="input-field" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Deskripsi</label>
                <textarea className="input-field min-h-24" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Batal</button>
                <button type="submit" className="btn-primary px-6">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
