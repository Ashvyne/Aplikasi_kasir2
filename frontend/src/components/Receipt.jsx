import React from 'react';
import { Printer, X, Receipt as ReceiptIcon } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { getSettings } from '../utils/settings';

const Receipt = ({ order, onClose }) => {
  const settings = getSettings();
  
  // Debug to verify what is actually being passed as items:
  console.log('Receipt rendering. Order details:', JSON.stringify(order, null, 2));

  const handlePrint = () => {
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=800,height=900');

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk - ${order.orderNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 5mm; width: 70mm; }
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 70mm; 
              padding: 5mm; 
              margin: 0 auto;
              font-size: 11px;
              color: #000;
              background: #fff;
              line-height: 1.2;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: 900; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .flex { display: flex; justify-content: space-between; gap: 4px; }
            .item-list { margin: 8px 0; }
            .item-row { margin-bottom: 5px; }
            .header { margin-bottom: 12px; }
            .footer { margin-top: 15px; font-size: 9px; line-height: 1.4; }
            .large { font-size: 14px; }
            .mt-1 { margin-top: 4px; }
            .mb-1 { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h1 style="margin: 0; font-size: 18px; letter-spacing: 2px; text-transform: uppercase;">${settings.storeName}</h1>
            <p style="margin: 2px 0;">${settings.storeDescription}</p>
            <p style="margin: 2px 0; font-size: 9px;">${settings.storeAddress}</p>
            <p style="margin: 2px 0; font-size: 9px;">WA: ${settings.storePhone}</p>
          </div>

          <div class="divider"></div>

          <div class="info">
            <div class="flex"><span>NO:</span><span class="bold">${order.orderNumber}</span></div>
            <div class="flex"><span>TGL:</span><span>${new Date(order.paidAt || order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
            <div class="flex"><span>KASIR:</span><span>${order.user?.name || 'Staff'}</span></div>
            <div class="flex"><span>TIPE:</span><span class="bold uppercase">${order.orderType === 'dine_in' ? `DINE IN (${order.table?.tableName || '?'})` : 'TAKEAWAY'}</span></div>
          </div>

          <div class="divider"></div>

          <div class="item-list">
            ${order.items?.map(item => `
              <div class="item-row">
                <div class="bold uppercase">${item.productName}</div>
                <div class="flex" style="padding-left: 8px;">
                  <span>${item.quantity} x ${formatCurrency(item.unitPrice).replace('Rp', '').trim()}</span>
                  <span>${formatCurrency(item.totalPrice).replace('Rp', '').trim()}</span>
                </div>
                ${item.notes ? `<div style="font-size: 9px; padding-left: 8px; font-style: italic;">* ${item.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="divider"></div>

          <div class="totals space-y-1">
            <div class="flex"><span>SUBTOTAL</span><span>${formatCurrency(order.subtotal).replace('Rp', '').trim()}</span></div>
            <div class="flex"><span>TAX (${order.taxRate || 10}%)</span><span>${formatCurrency(order.taxAmount).replace('Rp', '').trim()}</span></div>
            <div class="flex"><span>SERVICE (${order.serviceChargeRate || 5}%)</span><span>${formatCurrency(order.serviceCharge).replace('Rp', '').trim()}</span></div>
            ${parseFloat(order.tableSurcharge) > 0 ? `<div class="flex"><span>BIAYA MEJA</span><span>${formatCurrency(order.tableSurcharge).replace('Rp', '').trim()}</span></div>` : ''}
            ${parseFloat(order.discountAmount) > 0 ? `<div class="flex"><span>DISKON</span><span>-${formatCurrency(order.discountAmount).replace('Rp', '').trim()}</span></div>` : ''}
            <div class="divider"></div>
            <div class="flex bold large">
              <span>TOTAL</span><span>${formatCurrency(order.totalAmount).replace('Rp', '').trim()}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="payment-info">
            <div class="flex uppercase"><span>PAY: ${order.paymentMethod}</span><span>${formatCurrency(order.paidAmount).replace('Rp', '').trim()}</span></div>
            <div class="flex"><span>KEMBALI</span><span class="bold">${formatCurrency(order.changeAmount).replace('Rp', '').trim()}</span></div>
          </div>

          <div class="divider"></div>

          <div class="footer text-center">
            <p class="bold" style="text-transform: uppercase;">${settings.storeFooter}</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
            <p class="mt-1" style="opacity: 0.6;">Saran & Kritik: ${settings.storeEmail}</p>
            <div style="margin-top: 10px; font-size: 8px; letter-spacing: 1px;">** ${settings.storeName.toUpperCase()} CLOUD POS **</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999] p-4 transition-all duration-300">
      <div className="bg-white dark:bg-bg-dark rounded-[2.5rem] w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent-gold/20 p-2.5 rounded-2xl">
              <ReceiptIcon size={24} className="text-accent-gold" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Review Struk</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
          >
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-bg-darker/50">
          <div className="receipt-preview bg-white text-black p-8 shadow-2xl mx-auto w-full font-mono text-xs leading-relaxed border-t-[8px] border-accent-gold rounded-sm transform hover:scale-[1.02] transition-transform duration-500">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black tracking-[0.2em] uppercase line-clamp-1">{settings.storeName}</h2>
              <p className="text-[10px] mt-1 opacity-70 uppercase font-black">{settings.storeDescription}</p>
              <p className="text-[10px] mt-0.5 opacity-50">{settings.storeAddress}</p>
            </div>

            <div className="space-y-1 text-[10px] mb-4">
              <div className="flex justify-between"><span># {order.orderNumber}</span><span>{new Date(order.paidAt || order.createdAt).toLocaleTimeString()}</span></div>
              <div className="flex justify-between uppercase"><span>Table</span><span className="font-bold">{order.table?.tableName || 'TA'}</span></div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4"></div>

            <div className="space-y-4 mb-6">
              {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-xs">
                    <span className="uppercase">{item.productName || item.product?.name || item.name || 'Item'}</span>
                    <span>{formatCurrency(item.totalPrice).replace('Rp', '').trim()}</span>
                  </div>
                  <div className="text-[10px] opacity-60">
                    {item.quantity} x {formatCurrency(item.unitPrice).replace('Rp', '').trim()}
                  </div>
                </div>
              )) : (
                <div className="text-center text-xs opacity-50 py-2">Memuat item...</div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-black/10 my-4"></div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal).replace('Rp', '').trim()}</span></div>
              <div className="flex justify-between"><span>Tax (${order.taxRate || 10}%)</span><span>{formatCurrency(order.taxAmount).replace('Rp', '').trim()}</span></div>
              <div className="flex justify-between"><span>Service (${order.serviceChargeRate || 5}%)</span><span>{formatCurrency(order.serviceCharge).replace('Rp', '').trim()}</span></div>
              {parseFloat(order.tableSurcharge) > 0 && (
                <div className="flex justify-between"><span>Biaya Meja VIP</span><span>{formatCurrency(order.tableSurcharge).replace('Rp', '').trim()}</span></div>
              )}
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(order.discountAmount).replace('Rp', '').trim()}</span></div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-black">
                <span>TOTAL</span><span>{formatCurrency(order.totalAmount).replace('Rp', '').trim()}</span>
              </div>
            </div>

            <div className="mt-8 text-center text-[9px] uppercase font-black opacity-60">
              {settings.storeFooter}
            </div>
            <div className="mt-2 text-center text-[8px] opacity-30">
              {settings.storeName.toUpperCase()} POS SYSTEM
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 bg-white dark:bg-bg-dark flex flex-col gap-3">
          <button 
            onClick={handlePrint}
            className="w-full py-5 rounded-[2rem] bg-accent-gold text-black font-black flex items-center justify-center gap-3 hover:bg-yellow-400 shadow-glow transition-all active:scale-95 group"
          >
            <Printer size={24} className="group-hover:rotate-12 transition-transform" /> 
            CETAK STRUK SEKARANG
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-[2rem] text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Kembali ke Antarmuka
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
