const Product = require('../models/Product');
const StockIn = require('../models/StockIn');

/**
 * Get all stock in records
 */
exports.getAllStockIn = async (req, res) => {
  try {
    const records = await StockIn.findAll({
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'sku', 'name', 'buy_price', 'sell_price']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(records);
  } catch (error) {
    console.error('getAllStockIn error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get single stock in record
 */
exports.getStockInById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await StockIn.findByPk(id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'sku', 'name', 'buy_price', 'sell_price']
      }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Record tidak ditemukan' });
    }

    res.json(record);
  } catch (error) {
    console.error('getStockInById error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create stock in record (barang masuk)
 */
exports.createStockIn = async (req, res) => {
  try {
    const { product_id, quantity, notes } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({
        error: 'product_id dan quantity harus diisi'
      });
    }

    // Validate product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    // Create stock in record
    const stockIn = await StockIn.create({
      product_id,
      quantity: parseInt(quantity),
      notes: notes || null,
      created_by: req.user?.id || 1
    });

    // Update product stock
    product.stock = (product.stock || 0) + parseInt(quantity);
    await product.save();

    res.status(201).json({
      message: 'Barang masuk berhasil dicatat',
      data: stockIn,
      product_stock: product.stock
    });
  } catch (error) {
    console.error('createStockIn error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get stock in by product code (SKU)
 */
exports.getStockInByProductCode = async (req, res) => {
  try {
    const { sku } = req.params;

    const product = await Product.findOne({ where: { sku } });
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const records = await StockIn.findAll({
      where: { product_id: product.id },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'sku', 'name', 'buy_price', 'sell_price']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      product,
      stock_in_records: records
    });
  } catch (error) {
    console.error('getStockInByProductCode error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get stock in report for date range
 */
exports.getStockInReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let where = {};
    if (start_date && end_date) {
      where.createdAt = {
        [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const records = await StockIn.findAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'sku', 'name', 'buy_price', 'sell_price']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Group by product
    const grouped = {};
    records.forEach(record => {
      const sku = record.product.sku;
      if (!grouped[sku]) {
        grouped[sku] = {
          product_id: record.product_id,
          sku: sku,
          name: record.product.name,
          buy_price: record.product.buy_price,
          total_quantity: 0,
          records: []
        };
      }
      grouped[sku].total_quantity += record.quantity;
      grouped[sku].records.push({
        quantity: record.quantity,
        date: record.createdAt,
        notes: record.notes
      });
    });

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('getStockInReport error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete stock in record
 */
exports.deleteStockIn = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await StockIn.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record tidak ditemukan' });
    }

    // Reverse the stock update
    const product = await Product.findByPk(record.product_id);
    if (product) {
      product.stock = Math.max(0, (product.stock || 0) - record.quantity);
      await product.save();
    }

    await record.destroy();

    res.json({
      message: 'Record barang masuk berhasil dihapus'
    });
  } catch (error) {
    console.error('deleteStockIn error:', error);
    res.status(500).json({ error: error.message });
  }
};
