const { db } = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

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

// Export sales to Excel
exports.exportSalesExcel = (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = `SELECT t.*, COUNT(ti.id) as item_count
               FROM transactions t
               LEFT JOIN transaction_items ti ON t.id = ti.transaction_id`;
  const params = [];

  if (startDate && endDate) {
    query += ` WHERE DATE(t.transaction_date) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` GROUP BY t.id ORDER BY t.transaction_date DESC`;

  db.all(query, params, async (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Penjualan');

    // Header
    worksheet.columns = [
      { header: 'No Invoice', key: 'invoice_number', width: 20 },
      { header: 'Tanggal', key: 'transaction_date', width: 20 },
      { header: 'Total Barang', key: 'item_count', width: 12 },
      { header: 'Total Penjualan', key: 'total_amount', width: 15 },
      { header: 'Metode', key: 'payment_method', width: 12 },
      { header: 'Uang Diterima', key: 'cash_received', width: 15 },
      { header: 'Kembalian', key: 'change_amount', width: 15 }
    ];

    // Data
    transactions.forEach(t => {
      worksheet.addRow({
        invoice_number: t.invoice_number,
        transaction_date: new Date(t.transaction_date).toLocaleString('id-ID'),
        item_count: t.item_count,
        total_amount: t.total_amount,
        payment_method: t.payment_method,
        cash_received: t.cash_received,
        change_amount: t.change_amount
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    // Format currency
    worksheet.getColumn('D').numFmt = '"Rp " #,##0';
    worksheet.getColumn('F').numFmt = '"Rp " #,##0';
    worksheet.getColumn('G').numFmt = '"Rp " #,##0';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="penjualan.xlsx"');

    await workbook.xlsx.write(res);
  });
};

// Export products to Excel
exports.exportProductsExcel = (req, res) => {
  db.all(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ORDER BY p.name`,
    async (err, products) => {
      if (err) return res.status(500).json({ error: err.message });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Produk');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Nama Produk', key: 'name', width: 25 },
        { header: 'SKU', key: 'sku', width: 12 },
        { header: 'Kategori', key: 'category_name', width: 15 },
        { header: 'Harga', key: 'price', width: 12 },
        { header: 'Stok', key: 'stock', width: 10 },
        { header: 'Nilai Stok', key: 'stock_value', width: 15 }
      ];

      products.forEach(p => {
        worksheet.addRow({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category_name: p.category_name,
          price: p.price,
          stock: p.stock,
          stock_value: p.price * p.stock
        });
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

      worksheet.getColumn('E').numFmt = '"Rp " #,##0';
      worksheet.getColumn('G').numFmt = '"Rp " #,##0';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="produk.xlsx"');

      await workbook.xlsx.write(res);
    }
  );
};

// Helper format rupiah
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}
