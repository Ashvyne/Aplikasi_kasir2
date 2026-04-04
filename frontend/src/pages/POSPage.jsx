import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Coffee, MapPin, Search, Banknote, Wallet, Smartphone, X, CheckCircle2, Save, Send } from 'lucide-react';
import { orderService, tableService, productService, categoryService, API_BASE } from '../services/api';
import { formatCurrency, calculateOrderTotals } from '../utils/helpers';
import NumericInput from '../components/NumericInput';
import Receipt from '../components/Receipt';
import Swal from 'sweetalert2';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Checkout State
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [orderType, setOrderType] = useState('dine_in');
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [showOrderPanel, setShowOrderPanel] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, tablesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        tableService.getAll()
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

      let finalTables = [];
      if (Array.isArray(tablesRes)) finalTables = tablesRes;
      else if (tablesRes?.tables && Array.isArray(tablesRes.tables)) finalTables = tablesRes.tables;
      else if (tablesRes?.data?.tables && Array.isArray(tablesRes.data.tables)) finalTables = tablesRes.data.tables;
      else if (tablesRes?.data && Array.isArray(tablesRes.data)) finalTables = tablesRes.data;

      setProducts(finalProducts);
      setCategories(finalCategories);
      setTables(finalTables);
    } catch (error) {
      console.error('Error loading POS data:', error);
      Swal.fire('Error', 'Gagal memuat data menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetCart = () => {
    setCartItems([]);
    setCustomerName('');
    setSelectedTable('');
    setPaidAmount('');
    loadData();
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && p.stock > 0;
  });

  const getAvailableStock = (product) => {
    const inCart = cartItems.find(item => item.product.id === product.id)?.quantity || 0;
    return product.stock - inCart;
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) {
          Swal.fire('Stok Habis', 'Stok tidak mencukupi', 'warning');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock <= 0) {
        Swal.fire('Stok Habis', 'Stok tidak mencukupi', 'warning');
        return prev;
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock) {
            Swal.fire('Stok Habis', 'Stok tidak mencukupi', 'warning');
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeCartItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Called when user clicks 'Proses Pesanan'
  const openPaymentModal = () => {
    if (cartItems.length === 0) return Swal.fire('Error', 'Keranjang masih kosong!', 'error');
    if (orderType === 'dine_in' && !selectedTable) return Swal.fire('Error', 'Pilih meja untuk Dine-In!', 'error');
    setPaymentMethod('cash');
    setPaidAmount('');
    setShowPaymentModal(true);
  };

  // Called after payment modal is confirmed
  const confirmPayment = async () => {
    const totalToPay = totals.total + ((() => {
      const selTable = tables.find(t => t.id === parseInt(selectedTable));
      return parseFloat(selTable?.surchargeAmount) || 0;
    })());

    const paid = parseFloat(paidAmount);
    if (paymentMethod === 'cash' && (!paid || paid < totalToPay)) {
      return Swal.fire('Error', `Uang yang dibayar kurang! Minimal Rp ${totalToPay.toLocaleString('id-ID')}`, 'error');
    }

    try {
      setLoading(true);
      setShowPaymentModal(false);

      // 1. Create Order
      const res = await orderService.create({
        tableId: orderType === 'dine_in' ? selectedTable : null,
        orderType,
        customerName: customerName || 'Pelanggan',
        userId: 1
      });
      const orderId = res.data.id;

      // 2. Add Items
      for (const item of cartItems) {
        await orderService.addItem(orderId, {
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes
        });
      }

      // 3. Process Payment immediately
      await orderService.processPayment(orderId, {
        paidAmount: paymentMethod === 'cash' ? paid : totalToPay,
        paymentMethod
      });

      const change = paymentMethod === 'cash' ? Math.max(0, paid - totalToPay) : 0;
      
      // Store for receipt
      setCompletedOrder(res.data);
      
      Swal.fire({
        title: 'Pembayaran Berhasil! 🎉',
        html: `<p class="text-gray-700 dark:text-gray-300">Kembalian: <strong class="text-2xl text-green-600">Rp ${change.toLocaleString('id-ID')}</strong></p>`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#FFD700',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Cetak Struk',
        cancelButtonText: 'Selesai',
        customClass: {
          confirmButton: 'text-black font-bold',
        }
      }).then((result) => {
        if (result.isConfirmed) {
          setShowReceipt(true);
        } else {
          // Reset only if not printing
          resetCart();
        }
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error?.response?.data?.message || error.message || 'Gagal memproses pembayaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    if (cartItems.length === 0) return Swal.fire('Error', 'Keranjang masih kosong!', 'error');
    if (orderType === 'dine_in' && !selectedTable) return Swal.fire('Error', 'Pilih meja untuk Dine-In!', 'error');

    try {
      setLoading(true);
      
      // 1. Create Order
      const res = await orderService.create({
        tableId: orderType === 'dine_in' ? selectedTable : null,
        orderType,
        customerName: customerName || 'Pelanggan',
        userId: 1
      });
      const orderId = res.data.id;

      // 2. Add Items
      for (const item of cartItems) {
        await orderService.addItem(orderId, {
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes
        });
      }

      Swal.fire({
        title: 'Pesanan Disimpan! 📝',
        text: 'Pesanan telah dikirim ke dapur. Silakan proses pembayaran nanti dari menu Meja.',
        icon: 'success',
        confirmButtonColor: '#FFD700',
      });

      setCartItems([]);
      setCustomerName('');
      setSelectedTable('');
      loadData();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error?.response?.data?.message || error.message || 'Gagal menyimpan pesanan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mappedCartItems = cartItems.map(item => ({
    quantity: item.quantity,
    unitPrice: item.product.sell_price
  }));
  const totals = calculateOrderTotals(mappedCartItems);

  // Payment modal computed values (derived here to avoid IIFE in JSX)
  const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];
  const selTableForModal = tables.find(t => t.id === parseInt(selectedTable));
  const modalSurcharge = parseFloat(selTableForModal?.surchargeAmount) || 0;
  const grandTotal = totals.total + modalSurcharge;
  const paidNum = parseFloat(paidAmount) || 0;
  const changeAmount = Math.max(0, paidNum - grandTotal);
  const shortfall = grandTotal - paidNum;

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full gap-6 p-6 overflow-hidden">
        
      <div className="flex-1 flex flex-col h-[calc(100vh-100px)]">
        {/* Header & Search */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white transition-colors">Point of Sale</h1>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari menu..." 
              className="input-field pl-10 w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${selectedCategory === 'all' ? 'bg-accent-gold text-black font-bold' : 'bg-gray-200 dark:bg-bg-darker text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Semua Menu
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.toString())}
              className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${selectedCategory === cat.id.toString() ? 'bg-accent-gold text-black font-bold' : 'bg-gray-200 dark:bg-bg-darker text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Tidak ada produk ditemukan</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
              {filteredProducts.map(product => {
                const availableStock = getAvailableStock(product);
                return (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="card p-4 hover:border-accent-gold/50 cursor-pointer transition-all flex flex-col"
                >
                  <div className="bg-gray-100 dark:bg-bg-darker h-32 rounded-lg mb-3 flex items-center justify-center transition-colors overflow-hidden">
                    {product.image_url ? (
                      <img src={`${API_BASE.replace('/api', '')}${product.image_url}`} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <Coffee size={40} className="text-gray-400 dark:text-gray-600 transition-transform group-hover:scale-110" />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm transition-colors" title={product.name}>{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <p className="text-accent-gold font-bold">{formatCurrency(product.sell_price)}</p>
                    <span className={`text-xs px-2 py-1 rounded transition-colors ${availableStock <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Sisa: {availableStock}</span>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Cart */}
      <div className="w-full lg:w-96 card flex flex-col h-[calc(100vh-100px)]">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="text-accent-gold" /> Pesanan Baru
        </h2>

        {/* Order Details Form */}
        <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 transition-colors">
          <div className="flex bg-gray-100 dark:bg-bg-darker rounded-lg p-1 transition-colors">
            <button 
              onClick={() => setOrderType('dine_in')}
              className={`flex-1 py-1 px-2 text-sm rounded transition-colors ${orderType === 'dine_in' ? 'bg-accent-gold text-black font-bold' : 'text-gray-600 dark:text-gray-400'}`}
            >Dine In</button>
            <button 
              onClick={() => setOrderType('take_away')}
              className={`flex-1 py-1 px-2 text-sm rounded transition-colors ${orderType === 'take_away' ? 'bg-accent-gold text-black font-bold' : 'text-gray-600 dark:text-gray-400'}`}
            >Takeaway</button>
          </div>

          <input 
            type="text" 
            placeholder="Nama Pelanggan (opsional)" 
            className="input-field text-sm"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />

          {orderType === 'dine_in' && (
            <select 
              className="input-field text-sm"
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
            >
              <option value="">Pilih Meja...</option>
              {tables.filter(t => t.status === 'available').map(table => (
                <option key={table.id} value={table.id}>
                  {table.tableName} (Kap: {table.capacity}){parseFloat(table.surchargeAmount) > 0 ? ` ⭐ +Rp ${Number(table.surchargeAmount).toLocaleString('id-ID')}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ShoppingCart size={48} className="mb-2 opacity-50" />
              <p>Keranjang Kosong</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-bg-darker p-3 rounded-lg flex items-start justify-between border border-gray-200 dark:border-transparent transition-colors">
                <div className="flex-1 pr-2">
                  <p className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{item.product.name}</p>
                  <p className="text-accent-gold text-xs">{formatCurrency(item.product.sell_price)}</p>
                  <input 
                    type="text" 
                    placeholder="Catatan..." 
                    className="bg-white text-xs w-full mt-2 px-2 py-1 rounded text-gray-900 border border-gray-300 focus:border-accent-gold focus:outline-none transition-colors"
                    value={item.notes}
                    onChange={e => {
                      const newItems = [...cartItems];
                      newItems[idx].notes = e.target.value;
                      setCartItems(newItems);
                    }}
                  />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeCartItem(item.product.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-2 bg-gray-200 dark:bg-bg-dark rounded px-1 transition-colors">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:text-accent-gold"><Minus size={14} /></button>
                    <span className="text-xs font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:text-accent-gold"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 transition-colors">
          {/* Surcharge preview for selected VIP table */}
          {(() => {
            const selTable = tables.find(t => t.id === parseInt(selectedTable));
            const surcharge = parseFloat(selTable?.surchargeAmount) || 0;
            return (
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-400 transition-colors">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 transition-colors">
                  <span>Pajak (10%)</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 transition-colors">
                  <span>Layanan (5%)</span>
                  <span>{formatCurrency(totals.serviceCharge)}</span>
                </div>
                {surcharge > 0 && (
                  <div className="flex justify-between text-yellow-600 dark:text-yellow-400 transition-colors font-medium">
                    <span>⭐ Biaya Meja VIP</span>
                    <span>{formatCurrency(surcharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-800 transition-colors">
                  <span>Total</span>
                  <span className="text-accent-gold">{formatCurrency(totals.total + surcharge)}</span>
                </div>
              </div>
            );
          })()}
          
          <div className="flex gap-2">
            <button 
              onClick={handleSaveOrder}
              disabled={cartItems.length === 0 || loading}
              className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                cartItems.length === 0 ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-bg-darker text-accent-gold border border-accent-gold hover:bg-bg-dark transition-all'
              }`}
            >
              <Send size={18} />
              {loading ? '...' : 'Kirim ke Dapur'}
            </button>
            <button 
              onClick={openPaymentModal}
              disabled={cartItems.length === 0 || loading}
              className={`flex-[1.5] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                cartItems.length === 0 ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-accent-gold text-black hover:bg-yellow-400 shadow-glow'
              }`}
            >
              <CreditCard size={18} />
              {loading ? '...' : 'Bayar Langsung'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ─── PAYMENT MODAL ─── */}
    {showPaymentModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-accent-gold/10 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="text-accent-gold" size={22} /> Pembayaran
            </h2>
            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Order Summary */}
            <div className="bg-gray-50 dark:bg-bg-darker rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Pajak (10%)</span><span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Layanan (5%)</span><span>{formatCurrency(totals.serviceCharge)}</span>
              </div>
              {modalSurcharge > 0 && (
                <div className="flex justify-between text-yellow-600 dark:text-yellow-400 font-medium">
                  <span>⭐ Biaya Meja VIP</span><span>{formatCurrency(modalSurcharge)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-600">
                <span>Total</span>
                <span className="text-accent-gold">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash',    label: 'Tunai',          icon: Banknote },
                  { value: 'card',    label: 'Kartu Debit',    icon: CreditCard },
                  { value: 'digital', label: 'Digital / QRIS', icon: Smartphone },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                      paymentMethod === m.value
                        ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-accent-gold/50'
                    }`}
                  >
                    <m.icon size={20} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Input */}
            {paymentMethod === 'cash' && (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Uang Diterima</p>
                <NumericInput
                  value={paidAmount}
                  onChange={val => setPaidAmount(val.toString())}
                  prefix="Rp"
                  placeholder="Jumlah Bayar"
                  className="text-lg font-bold"
                />

                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => setPaidAmount(grandTotal.toString())}
                    className="px-3 py-1.5 bg-accent-gold text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition"
                  >
                    Uang Pas
                  </button>
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setPaidAmount(prev => ((parseFloat(prev) || 0) + amt).toString())}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-bg-darker text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-bg-light border border-gray-200 dark:border-gray-700 transition"
                    >
                      +{amt >= 1000 ? `${amt/1000}rb` : amt}
                    </button>
                  ))}
                  {paidNum > 0 && (
                    <button
                      onClick={() => setPaidAmount('')}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-200 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Change Display */}
                {paidNum > 0 && (
                  <div className={`mt-3 p-3 rounded-xl text-center font-bold text-lg transition-all ${
                    paidNum >= grandTotal
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}>
                    {paidNum >= grandTotal
                      ? <>✅ Kembalian: {formatCurrency(changeAmount)}</>
                      : <>⚠️ Kurang: {formatCurrency(shortfall)}</>
                    }
                  </div>
                )}
                {/* Receipt Modal */}
      {showReceipt && completedOrder && (
        <Receipt 
          order={completedOrder} 
          onClose={() => {
            setShowReceipt(false);
            resetCart();
          }} 
        />
      )}
    </div>
            )}

            {/* Non-cash info */}
            {paymentMethod !== 'cash' && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/30 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-400 text-center">
                {paymentMethod === 'card' ? '💳 Silakan gesek atau tap kartu pelanggan.' : '📱 Scan QR / konfirmasi transfer sudah diterima?'}
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={confirmPayment}
              disabled={loading || (paymentMethod === 'cash' && (!paidNum || paidNum < grandTotal))}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                loading || (paymentMethod === 'cash' && (!paidNum || paidNum < grandTotal))
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-accent-gold text-black hover:bg-yellow-400 shadow-lg'
              }`}
            >
              <CheckCircle2 size={20} />
              {loading ? 'Memproses...' : `Konfirmasi Bayar ${formatCurrency(grandTotal)}`}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
