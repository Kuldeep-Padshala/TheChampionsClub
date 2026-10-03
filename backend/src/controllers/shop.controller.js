const db = require('../config/db.js');

// ============================================
// 1. Catalog & Barcode Scanning (POS Interface)
// ============================================

const getCatalog = async (req, res) => {
  try {
    // Fetch products and variants in one go, or structured
    const [variants] = await db.query(`
      SELECT v.*, p.name as product_name, p.description, c.name as category_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN product_categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `);


    
    // Group variants by product name
    const catalog = variants.reduce((acc, item) => {
      const prod = item.product_name;
      if (!acc[prod]) acc[prod] = { product_name: prod, category: item.category_name, description: item.description, variants: [] };
      acc[prod].variants.push({
        variant_id: item.id,
        sku: item.sku,
        size: item.size,
        color: item.color,
        price: item.price,
        stock_quantity: item.stock_quantity
      });
      return acc;
    }, {});

    res.status(200).json({ success: true, data: Object.values(catalog) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getVariantBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const [variants] = await db.query(`
      SELECT v.*, p.name as product_name 
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.sku = ? AND p.is_active = 1
    `, [sku]);

    if (variants.length === 0) {
      return res.status(404).json({ success: false, message: 'Product variant not found or inactive' });
    }

    res.status(200).json({ success: true, data: variants[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 2. In-Store Checkout (Over-The-Counter Sales)
// ============================================

const processInStoreSale = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { member_id, items, payment_method } = req.body; 
    // items: array of { variant_id, quantity }

    let totalAmount = 0;
    const itemsToProcess = [];

    // 1. Verify stock and calculate total
    for (const item of items) {
      const [variants] = await db.query('SELECT price, stock_quantity FROM product_variants WHERE id = ?', [item.variant_id]);
      if (variants.length === 0) {
        return res.status(404).json({ success: false, message: 'Variant ID ' + item.variant_id + ' not found' });
      }
      
      const variant = variants[0];
      if (variant.stock_quantity < item.quantity) {
        return res.status(400).json({ success: false, message: 'Insufficient stock for Variant ID ' + item.variant_id });
      }

      const lineTotal = variant.price * item.quantity;
      totalAmount += lineTotal;
      itemsToProcess.push({
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: variant.price,
        line_total: lineTotal
      });
    }

    // 2. Create Shop Order
    const orderNo = 'POS-' + Date.now();
    const [orderResult] = await db.query(
      'INSERT INTO shop_orders (order_no, member_id, status, total_amount, placed_at, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [orderNo, member_id || null, 'Completed', totalAmount]
    );
    const orderId = orderResult.insertId;

    // 3. Process Items: Insert into shop_order_items & Deduct Stock
    for (const item of itemsToProcess) {
      // Insert order item
      await db.query(
        'INSERT INTO shop_order_items (order_id, variant_id, quantity, unit_price, line_total, status) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.variant_id, item.quantity, item.unit_price, item.line_total, 'Fulfilled']
      );

      // Deduct physical inventory
      await db.query(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.variant_id]
      );

      // Log Stock Movement
      await db.query(
        'INSERT INTO stock_movements (variant_id, quantity, movement_type, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [item.variant_id, -item.quantity, 'Sale', 'Sold in POS order ' + orderNo, staffId]
      );
    }

    // 4. Generate Invoice and Payment
    const invoiceNo = 'INV-' + orderNo;
    const [invoiceResult] = await db.query(
      'INSERT INTO invoices (invoice_no, member_id, total_amount, status, issue_date, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [invoiceNo, member_id || null, totalAmount, 'Paid']
    );

    await db.query(
      'INSERT INTO payments (invoice_id, amount, payment_method, status, payment_date, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [invoiceResult.insertId, totalAmount, payment_method || 'Cash', 'Successful']
    );

    res.status(201).json({ success: true, message: 'Sale processed successfully', orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. Online Order Fulfillment (Click & Collect)
// ============================================

const getPendingPickups = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, m.full_name as member_name 
      FROM shop_orders o
      LEFT JOIN members mem ON o.member_id = mem.id
      LEFT JOIN users m ON mem.user_id = m.id
      WHERE o.status = 'Pending' OR o.status = 'Processing'
      ORDER BY o.placed_at ASC
    `);

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const fulfillOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query('SELECT status FROM shop_orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    if (orders[0].status === 'Completed') return res.status(400).json({ success: false, message: 'Order is already fulfilled' });

    // Update main order
    await db.query('UPDATE shop_orders SET status = "Completed", updated_at = NOW() WHERE id = ?', [id]);
    
    // Update individual items
    await db.query('UPDATE shop_order_items SET status = "Fulfilled" WHERE order_id = ?', [id]);

    res.status(200).json({ success: true, message: 'Order fulfilled and handed to customer' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. Returns & Exchanges
// ============================================

const processReturn = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { id } = req.params; // order id
    const { item_ids } = req.body; // array of shop_order_item IDs being returned

    // 1. Fetch order to ensure it exists
    const [orders] = await db.query('SELECT * FROM shop_orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    const order = orders[0];

    let totalRefund = 0;

    // Process each returned item
    for (const itemId of item_ids) {
      const [items] = await db.query('SELECT * FROM shop_order_items WHERE id = ? AND order_id = ? AND status != "Returned"', [itemId, id]);
      if (items.length > 0) {
        const item = items[0];
        totalRefund += Number(item.line_total);

        // Mark item as returned
        await db.query('UPDATE shop_order_items SET status = "Returned" WHERE id = ?', [itemId]);

        // Restock physical inventory
        await db.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.variant_id]);

        // Log Stock Movement
        await db.query(
          'INSERT INTO stock_movements (variant_id, quantity, movement_type, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [item.variant_id, item.quantity, 'Return', 'Returned from order ' + order.order_no, staffId]
        );
      }
    }

    if (totalRefund === 0) {
      return res.status(400).json({ success: false, message: 'No eligible items to return' });
    }

    // Update overall order status if all items are returned
    const [remainingItems] = await db.query('SELECT COUNT(*) as count FROM shop_order_items WHERE order_id = ? AND status != "Returned"', [id]);
    if (remainingItems[0].count === 0) {
      await db.query('UPDATE shop_orders SET status = "Returned" WHERE id = ?', [id]);
    }

    // 2. Generate Refund in Billing Module
    // Find the invoice tied to this order
    const [invoices] = await db.query('SELECT id FROM invoices WHERE invoice_no = ?', ['INV-' + order.order_no]);
    if (invoices.length > 0) {
      const invoiceId = invoices[0].id;
      // Record refund
      await db.query(
        'INSERT INTO refunds (invoice_id, amount, reason, processed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
        [invoiceId, totalRefund, 'Customer returned items', staffId]
      );
    }

    res.status(200).json({ success: true, message: 'Items returned successfully', refund_amount: totalRefund });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getCatalog,
  getVariantBySku,
  processInStoreSale,
  getPendingPickups,
  fulfillOrder,
  processReturn
};
