import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../context/store';
import { ShoppingBag, ChevronRight, Plus, Search } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';

export default function CustomerMenu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { addItem, orderItems, getCartTotal } = useOrderStore();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const catsData = await catsRes.json();
        const prodsData = await prodsRes.json();
        
        // Use .data if present, otherwise fallback to .categories, or empty array safely
        const fetchedCategories = catsData.data || catsData.categories || [];
        setCategories([{ id: null, name: 'Semua Menu' }, ...fetchedCategories]);
        
        const fetchedProducts = prodsData.products || prodsData.data || [];
        setProducts(fetchedProducts);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Handle filtering
  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === null || p.categoryId === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-black w-full relative pb-24">
      {/* Search Header */}
      <div className="px-4 py-4 pt-6 bg-white dark:bg-bg-dark border-b border-gray-100 dark:border-gray-800 rounded-b-3xl shadow-sm z-10 sticky top-0">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Mau makan apa<br/>hari ini? 😋</h2>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari makanan favoritmu..." 
            className="w-full bg-gray-100 dark:bg-bg-darker border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-accent-gold dark:text-white font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="px-4 py-5 flex overflow-x-auto space-x-3 hide-scrollbar">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id || 'all'}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all transform active:scale-95 ${
                isActive 
                  ? 'bg-gray-900 text-white dark:bg-accent-gold dark:text-black shadow-lg shadow-gray-900/20 dark:shadow-accent-gold/20' 
                  : 'bg-white text-gray-600 border border-gray-200 dark:bg-bg-dark dark:text-gray-400 dark:border-gray-800'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div className="px-4 flex-1 overflow-y-auto mb-6 hide-scrollbar">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4].map(n => (
              <div key={n} className="bg-white dark:bg-bg-dark rounded-3xl p-4 animate-pulse aspect-[3/4]">
                <div className="w-full h-1/2 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-4"></div>
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded-full mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-5xl block mb-4 border-2 border-dashed border-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto opacity-50">🍽</span>
            <p className="font-bold text-gray-500">Ups, tidak ada menu ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => {
              const cartItem = orderItems.find(item => item.id === product.id || item.productId === product.id);
              const quantity = cartItem ? cartItem.quantity : 0;
              
              return (
                <div key={product.id} className="group bg-white dark:bg-bg-dark border border-gray-100 dark:border-gray-800/50 p-4 rounded-[2rem] flex flex-col hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all overflow-hidden relative">
                  
                  {/* Item Quantity Badge */}
                  {quantity > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-accent-gold text-black w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg">
                      {quantity}
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-bg-darker dark:to-gray-900 flex items-center justify-center mb-4 relative overflow-hidden">
                    {product.image_url ? (
                      <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" onError={(e)=>{e.target.style.display='none';}} />
                    ) : (
                      <span className="text-5xl font-black text-gray-200 dark:text-gray-800 uppercase group-hover:scale-125 transition duration-500">
                        {product.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 flex flex-col relative z-10">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-accent-gold font-black mt-auto pt-2">
                       {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price || product.sell_price)}
                    </p>
                    
                    <button 
                      onClick={() => addItem({ ...product, productId: product.id, quantity: 1, unitPrice: product.price || product.sell_price })}
                      className="mt-4 w-full py-3 bg-gray-50 dark:bg-bg-darker hover:bg-gray-900 hover:text-white dark:hover:bg-accent-gold dark:hover:text-black text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-1 active:scale-95"
                    >
                      <Plus size={16} /> Tambah
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Checkout Button using Glassmorphism */}
      {orderItems.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50">
          <button 
            onClick={() => navigate('/customer/checkout')}
            className="w-full max-w-lg bg-gray-900/90 dark:bg-white/90 backdrop-blur-xl text-white dark:text-black rounded-2xl p-2 pl-6 pr-2 flex justify-between items-center shadow-2xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/10 dark:bg-black/10 p-2 rounded-xl">
                 <ShoppingBag size={20} />
              </div>
              <div className="text-left py-2">
                <p className="text-xs text-white/70 dark:text-black/60 font-medium">{orderItems.length} menu di keranjang</p>
                <p className="font-black text-lg">Rp {getCartTotal().toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-black text-gray-900 dark:text-white w-14 h-14 rounded-xl flex items-center justify-center font-bold relative overflow-hidden group-hover:scale-105 transition-transform">
               <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
