import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, Utensils, Clock, Receipt as ReceiptIcon } from 'lucide-react';
import Receipt from '../../components/Receipt';

export default function CustomerOrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  useEffect(() => {
    // If order is not in state, we might fetch it here
    if (!order) {
      setOrder({ orderNumber: id });
    }
    window.scrollTo(0, 0);
  }, [id, order]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 bg-white dark:bg-black min-h-[calc(100vh-80px)] transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-gold/10 dark:bg-accent-gold/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 dark:opacity-30 rounded-full animate-pulse" />
          <div className="w-28 h-28 bg-gradient-to-tr from-green-400 to-green-500 text-white rounded-full flex items-center justify-center relative z-10 shadow-2xl shadow-green-500/30">
            <Check size={56} strokeWidth={3} />
          </div>
        </div>
        
        <h2 className="text-3xl font-black mb-3 text-gray-900 dark:text-white tracking-tight">Pesanan Berhasil!</h2>
        <p className="text-gray-500 dark:text-gray-400 font-bold mb-8 text-base">Pesanan telah masuk ke dapur kami.</p>
        
        <div className="bg-white dark:bg-bg-dark border border-gray-100 dark:border-gray-800 p-8 rounded-[2rem] w-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-xl relative overflow-hidden mb-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-gold to-yellow-500" />
          
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Nomor Pesanan</p>
          <p className="text-5xl font-black text-gray-900 dark:text-white tracking-wider font-mono bg-clip-text text-transparent bg-gradient-to-r from-accent-gold to-orange-400">{id}</p>
          
          <div className="border-t-2 border-dashed border-gray-100 dark:border-gray-800 my-6" />
          
          <div className="flex items-start gap-4 text-left bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20 mb-6">
            <Clock className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 leading-snug">
              Harap tunjukkan nomor ini di kasir jika Anda memilih Bayar di Kasir.
            </p>
          </div>

          {order && order.id && (
            <button 
              onClick={() => setShowReceipt(true)}
              className="w-full flex items-center justify-center gap-2 bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold dark:text-yellow-400 font-bold py-3 rounded-xl transition-colors border border-accent-gold/20"
            >
              <ReceiptIcon size={20} />
              Tampilkan Struk
            </button>
          )}
        </div>
        
        <button 
          onClick={() => navigate('/customer/menu')}
          className="group w-full max-w-sm bg-gray-50 hover:bg-gray-100 dark:bg-bg-darker dark:hover:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-black py-4 pl-6 pr-4 rounded-2xl transition-all shadow-sm flex items-center justify-between"
        >
          <span>Pesan Lagi</span>
          <div className="bg-white dark:bg-black p-2 rounded-xl shadow-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            <Utensils size={18} />
          </div>
        </button>
      </div>

      {/* Receipt Modal */}
      {showReceipt && order && (
        <Receipt 
          order={order} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}
