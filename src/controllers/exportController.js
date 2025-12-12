const { db } = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

// Print struk
exports.printStruk = (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM transactions WHERE id = ?`, [id], (err, transaction) => {
    if (err || !transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    db.all(
      `SELECT ti.*, p.name, p.sku FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = ?`,
      [id],
      (err, items) => {
        if (err) return res.status(500).json({ error: err.message });

        // Create PDF
        const doc = new PDFDocument({ size: [226.77, 500], margin: 10 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="struk-${transaction.invoice_number}.pdf"`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(14).font('Helvetica-Bold').text('TOKO KASIR', { align: 'center' });
        doc.fontSize(9).text('Jl. Jalan Raya No. 123', { align: 'center' });
        doc.fontSize(9).text('Telp: 0812-3456-7890', { align: 'center' });
        doc.moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();

        // Invoice info
        doc.fontSize(9).text(`No. Invoice: ${transaction.invoice_number}`);
        doc.text(`Tanggal: ${new Date(transaction.transaction_date).toLocaleString('id-ID')}`);
        doc.text(`Metode: ${transaction.payment_method}`);
        doc.moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();

        // Items header
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Barang', 10, doc.y, { width: 100 });
        doc.text('Qty', 110, doc.y - 12, { width: 30, align: 'right' });
        doc.text('Harga', 140, doc.y - 12, { width: 67, align: 'right' });
        doc.moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();

        // Items
        doc.fontSize(8).font('Helvetica');
        items.forEach(item => {
          doc.text(item.name, 10, doc.y, { width: 100 });
          doc.text(`${item.quantity}x`, 110, doc.y - 12, { width: 30, align: 'right' });
          doc.text(formatRupiah(item.subtotal), 140, doc.y - 12, { width: 67, align: 'right' });
        });

        doc.moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();

        // Total
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(`Total: ${formatRupiah(transaction.total_amount)}`, { align: 'right' });
        doc.text(`Diterima: ${formatRupiah(transaction.cash_received)}`, { align: 'right' });
        doc.text(`Kembalian: ${formatRupiah(transaction.change_amount)}`, { align: 'right' });

        // Footer
        doc.moveTo(10, doc.y + 10).lineTo(216.77, doc.y + 10).stroke();
        doc.fontSize(8).text('Terima kasih atas pembelian Anda', { align: 'center' });
        doc.text(new Date().toLocaleString('id-ID'), { align: 'center' });

        doc.end();
      }
    );
  });
};

// Helper function untuk format currency
function formatCurrency(value) {
  return parseInt(value) || 0;
}

// Helper function untuk format date
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

// Export Sales to Excel
exports.exportSalesExcel = async (req, res) => {
  try {
    console.log('📊 Exporting sales to Excel...');

    const transactions = await Transaction.findAll({
      order: [['created_at', 'DESC']]
    });

    console.log('📦 Found', transactions.length, 'transactions');

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Penjualan', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Define columns
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5, style: { alignment: { horizontal: 'center' } } },
      { header: 'No Invoice', key: 'invoice', width: 15 },
      { header: 'Tanggal', key: 'date', width: 18 },
      { header: 'Item', key: 'items', width: 8, style: { alignment: { horizontal: 'center' } } },
      { header: 'Total (Rp)', key: 'total', width: 15, style: { alignment: { horizontal: 'right' } } },
      { header: 'Diskon (Rp)', key: 'discount', width: 15, style: { alignment: { horizontal: 'right' } } },
      { header: 'Metode', key: 'method', width: 12 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    worksheet.getRow(1).height = 25;

    // Add data rows
    let totalRevenue = 0;
    let totalDiscount = 0;
    let rowNum = 2;

    for (const trans of transactions) {
      let items = trans.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }
      
      const itemCount = Array.isArray(items) ? items.length : 0;
      const total = formatCurrency(trans.total);
      const discount = formatCurrency(trans.discount);

      worksheet.addRow({
        no: rowNum - 1,
        invoice: trans.invoiceNumber || 'N/A',
        date: formatDate(trans.createdAt),
        items: itemCount,
        total: total,
        discount: discount,
        method: trans.paymentMethod || 'Tunai'
      });

      // Format data cells
      const row = worksheet.getRow(rowNum);
      row.getCell('no').alignment = { horizontal: 'center' };
      row.getCell('total').numFmt = '#,##0';
      row.getCell('discount').numFmt = '#,##0';

      totalRevenue += total;
      totalDiscount += discount;
      rowNum++;
    }

    // Add total row
    const totalRowNum = rowNum;
    worksheet.addRow({
      no: '',
      invoice: 'TOTAL',
      date: '',
      items: '',
      total: totalRevenue,
      discount: totalDiscount,
      method: ''
    });

    const totalRow = worksheet.getRow(totalRowNum);
    totalRow.font = { bold: true, size: 11 };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
    totalRow.getCell('total').numFmt = '#,##0';
    totalRow.getCell('discount').numFmt = '#,##0';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Penjualan.xlsx"');

    console.log('✓ Sales Excel exported successfully');
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error exporting sales:', error);
    res.status(500).json({ success: false, message: 'Gagal export data penjualan', error: error.message });
  }
};

// Export Products to Excel
exports.exportProductsExcel = async (req, res) => {
  try {
    console.log('📊 Exporting products to Excel...');

    const products = await Product.findAll({
      order: [['name', 'ASC']]
    });

    console.log('📦 Found', products.length, 'products');

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Produk', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Define columns
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5, style: { alignment: { horizontal: 'center' } } },
      { header: 'Nama Produk', key: 'name', width: 25 },
      { header: 'SKU', key: 'sku', width: 12 },
      { header: 'Kategori', key: 'category', width: 12 },
      { header: 'Harga (Rp)', key: 'price', width: 15, style: { alignment: { horizontal: 'right' } } },
      { header: 'Stok', key: 'stock', width: 10, style: { alignment: { horizontal: 'center' } } }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    worksheet.getRow(1).height = 25;

    // Category mapping
    const categoryMap = {
      '1': 'Makanan',
      '2': 'Minuman',
      '3': 'Snack',
      '4': 'Elektronik',
      '5': 'Lainnya'
    };

    // Add data rows
    let totalValue = 0;
    let totalStock = 0;
    let rowNum = 2;

    for (const product of products) {
      const price = formatCurrency(product.price);
      const stock = formatCurrency(product.stock);
      const value = price * stock;

      worksheet.addRow({
        no: rowNum - 1,
        name: product.name,
        sku: product.sku,
        category: categoryMap[product.category] || 'Lainnya',
        price: price,
        stock: stock
      });

      // Format data cells
      const row = worksheet.getRow(rowNum);
      row.getCell('no').alignment = { horizontal: 'center' };
      row.getCell('price').numFmt = '#,##0';
      row.getCell('stock').alignment = { horizontal: 'center' };

      totalValue += value;
      totalStock += stock;
      rowNum++;
    }

    // Add total row
    const totalRowNum = rowNum;
    worksheet.addRow({
      no: '',
      name: 'TOTAL',
      sku: '',
      category: '',
      price: totalValue,
      stock: totalStock
    });

    const totalRow = worksheet.getRow(totalRowNum);
    totalRow.font = { bold: true, size: 11 };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
    totalRow.getCell('price').numFmt = '#,##0';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Daftar_Produk.xlsx"');

    console.log('✓ Products Excel exported successfully');
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error exporting products:', error);
    res.status(500).json({ success: false, message: 'Gagal export data produk', error: error.message });
  }
};

// Export Reports Summary
exports.exportReportsExcel = async (req, res) => {
  try {
    console.log('📊 Exporting reports to Excel...');

    const transactions = await Transaction.findAll();
    const products = await Product.findAll();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ringkasan', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    // Define columns
    worksheet.columns = [
      { header: 'Keterangan', key: 'keterangan', width: 30 },
      { header: 'Nilai', key: 'nilai', width: 20, style: { alignment: { horizontal: 'right' } } }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };
    worksheet.getRow(1).height = 25;

    // Get statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTrans = transactions.filter(t => {
      const d = new Date(t.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const todayRevenue = todayTrans.reduce((sum, t) => sum + formatCurrency(t.total), 0);
    const totalRevenue = transactions.reduce((sum, t) => sum + formatCurrency(t.total), 0);
    const lowStock = products.filter(p => p.stock < 10 && p.stock > 0).length;

    // Add data
    const data = [
      { keterangan: 'Tanggal Laporan', nilai: formatDate(new Date()) },
      { keterangan: 'Transaksi Hari Ini', nilai: todayTrans.length },
      { keterangan: 'Pendapatan Hari Ini (Rp)', nilai: todayRevenue },
      { keterangan: 'Total Transaksi', nilai: transactions.length },
      { keterangan: 'Total Pendapatan (Rp)', nilai: totalRevenue },
      { keterangan: 'Total Produk', nilai: products.length },
      { keterangan: 'Stok Habis/Terbatas', nilai: lowStock }
    ];

    let rowNum = 2;
    for (const item of data) {
      worksheet.addRow(item);
      
      const row = worksheet.getRow(rowNum);
      if (item.keterangan.includes('Rp') || typeof item.nilai === 'number') {
        row.getCell('nilai').numFmt = '#,##0';
      }
      
      rowNum++;
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Ringkasan.xlsx"');

    console.log('✓ Reports Excel exported successfully');
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error exporting reports:', error);
    res.status(500).json({ success: false, message: 'Gagal export laporan', error: error.message });
  }
};
