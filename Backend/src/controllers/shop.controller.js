const { pool } = require('../config/db');

// ============================================
// 1. Catalog & Barcode Scanning (POS Interface)
// ============================================

const getCatalog = async (req, res) => {
  try {
    const [variants] = await pool.query(`
      SELECT 
        v.id as variant_id,
        v.sku,
        v.barcode,
        v.size,
        v.color,
        COALESCE(v.price_override, p.base_price) as price,
        v.stock_on_hand as stock_quantity,
        v.reorder_level,
        p.id as product_id,
        p.name as product_name,
        p.description,
        p.image_url,
        c.name as category_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN product_categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.name ASC, v.size ASC
    `);

    // Group variants by product
    const catalogMap = {};
    for (const item of variants) {
      if (!catalogMap[item.product_name]) {
        catalogMap[item.product_name] = {
          product_id: item.product_id,
          product_name: item.product_name,
          category: item.category_name,
          description: item.description,
          image_url: item.image_url,
          variants: []
        };
      }
      catalogMap[item.product_name].variants.push({
        variant_id: item.variant_id,
        sku: item.sku,
        barcode: item.barcode,
        size: item.size,
        color: item.color,
        price: Number(item.price),
        stock_quantity: item.stock_quantity,
        reorder_level: item.reorder_level
      });
    }

    res.status(200).json({
      success: true,
      data: Object.values(catalogMap),
      flatVariants: variants.map(v => ({
        ...v,
        price: Number(v.price)
      }))
    });
  } catch (error) {
    console.error('[getCatalog error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving catalog' });
  }
};

const getVariantBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const [variants] = await pool.query(`
      SELECT 
        v.id as variant_id,
        v.sku,
        v.barcode,
        v.size,
        v.color,
        COALESCE(v.price_override, p.base_price) as price,
        v.stock_on_hand as stock_quantity,
        p.id as product_id,
        p.name as product_name,
        p.image_url,
        c.name as category_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN product_categories c ON p.category_id = c.id
      WHERE (v.sku = ? OR v.barcode = ?) AND p.is_active = 1
      LIMIT 1
    `, [sku, sku]);

    if (variants.length === 0) {
      return res.status(404).json({ success: false, message: `Product variant with SKU/barcode '${sku}' not found` });
    }

    res.status(200).json({
      success: true,
      data: {
        ...variants[0],
        price: Number(variants[0].price)
      }
    });
  } catch (error) {
    console.error('[getVariantBySku error]', error);
    res.status(500).json({ success: false, message: 'Server error looking up variant' });
  }
};

// ============================================
// 2. In-Store Checkout (Over-The-Counter Sales)
// ============================================

const processInStoreSale = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const staffId = req.user.id;
    const { member_id, items, payment_method = 'upi', discount_pct = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided for checkout' });
    }

    await connection.beginTransaction();

    let subtotal = 0;
    const itemsToProcess = [];

    // 1. Verify stock and calculate total
    for (const item of items) {
      const [variants] = await connection.query(`
        SELECT v.id, v.stock_on_hand, COALESCE(v.price_override, p.base_price) as price, p.name as product_name
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = ? FOR UPDATE
      `, [item.variant_id]);

      if (variants.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: `Variant ID ${item.variant_id} not found` });
      }

      const variant = variants[0];
      const qty = Number(item.quantity) || 1;
      if (variant.stock_on_hand < qty) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${variant.product_name}". Available: ${variant.stock_on_hand}, Requested: ${qty}`
        });
      }

      const unitPrice = Number(variant.price);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      itemsToProcess.push({
        variant_id: variant.id,
        product_name: variant.product_name,
        quantity: qty,
        unit_price: unitPrice,
        line_total: lineTotal,
        current_stock: variant.stock_on_hand
      });
    }

    const discountAmount = Number(((subtotal * discount_pct) / 100).toFixed(2));
    const totalAmount = Number((subtotal - discountAmount).toFixed(2));
    const orderNo = 'POS-' + Date.now();

    // 2. Insert into shop_orders with strict constraints:
    // channel: 'counter', fulfillment_type: 'in_store', status: 'completed'
    const [orderResult] = await connection.query(`
      INSERT INTO shop_orders (
        order_no, member_id, channel, fulfillment_type, status,
        taken_by, member_discount_pct, subtotal, discount_total, tax_total,
        total_amount, placed_at, completed_at
      ) VALUES (?, ?, 'counter', 'in_store', 'completed', ?, ?, ?, ?, 0.00, ?, NOW(), NOW())
    `, [orderNo, member_id || null, staffId, discount_pct, subtotal, discountAmount, totalAmount]);

    const orderId = orderResult.insertId;

    // 3. Process items: insert into shop_order_items, decrement stock & log movement
    for (const item of itemsToProcess) {
      await connection.query(`
        INSERT INTO shop_order_items (
          order_id, variant_id, product_name, quantity, unit_price, discount_amount, line_total
        ) VALUES (?, ?, ?, ?, ?, 0.00, ?)
      `, [orderId, item.variant_id, item.product_name, item.quantity, item.unit_price, item.line_total]);

      const newBalance = item.current_stock - item.quantity;
      await connection.query(`
        UPDATE product_variants SET stock_on_hand = ? WHERE id = ?
      `, [newBalance, item.variant_id]);

      await connection.query(`
        INSERT INTO stock_movements (
          variant_id, quantity_change, reason, reference_type, reference_id,
          balance_after, notes, performed_by, created_at
        ) VALUES (?, ?, 'sale', 'shop_order', ?, ?, ?, ?, NOW())
      `, [item.variant_id, -item.quantity, orderId, newBalance, `POS Sale ${orderNo}`, staffId]);
    }

    // 4. Generate Invoice and Payment
    const invoiceNo = 'INV-' + orderNo;
    const [invoiceResult] = await connection.query(`
      INSERT INTO invoices (
        invoice_no, member_id, status, issue_date, due_date,
        subtotal, discount_total, tax_total, total_amount, amount_paid,
        balance_due, notes, issued_by, created_at
      ) VALUES (?, ?, 'paid', CURDATE(), CURDATE(), ?, ?, 0.00, ?, ?, 0.00, ?, ?, NOW())
    `, [invoiceNo, member_id || null, subtotal, discountAmount, totalAmount, totalAmount, `POS Counter Order ${orderNo}`, staffId]);

    const invoiceId = invoiceResult.insertId;
    const receiptNo = 'RCT-' + Date.now();

    // Normalize payment method to lowercase check constraint: 'cash', 'card', 'upi', 'online', 'bank_transfer', 'cheque'
    const normalizedMethod = (payment_method || 'upi').toLowerCase().replace(/\s+/g, '_');
    const validMethod = ['cash', 'card', 'upi', 'online', 'bank_transfer', 'cheque'].includes(normalizedMethod)
      ? normalizedMethod
      : 'upi';

    await connection.query(`
      INSERT INTO payments (
        receipt_no, invoice_id, amount, method, status, received_by, paid_at, notes, created_at
      ) VALUES (?, ?, ?, ?, 'success', ?, NOW(), ?, NOW())
    `, [receiptNo, invoiceId, totalAmount, validMethod, staffId, `POS Checkout ${orderNo}`]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Sale processed successfully',
      data: {
        orderId,
        orderNo,
        invoiceNo,
        receiptNo,
        totalAmount,
        subtotal,
        discountAmount,
        paymentMethod: validMethod.toUpperCase()
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('[processInStoreSale error]', error);
    res.status(500).json({ success: false, message: 'Server error processing sale' });
  } finally {
    connection.release();
  }
};

// ============================================
// 3. Online Order Fulfillment (Click & Collect)
// ============================================

const getPendingPickups = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.id,
        o.order_no,
        o.member_id,
        o.channel,
        o.fulfillment_type,
        o.status,
        o.total_amount,
        o.subtotal,
        o.placed_at,
        o.ready_at,
        COALESCE(u.full_name, 'Guest Customer') as customer_name,
        COALESCE(u.email, '') as customer_email,
        COALESCE(u.phone, '') as customer_phone
      FROM shop_orders o
      LEFT JOIN members mem ON o.member_id = mem.id
      LEFT JOIN users u ON mem.user_id = u.id
      WHERE o.status IN ('pending', 'confirmed', 'ready_for_pickup')
      ORDER BY o.placed_at ASC
    `);

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await pool.query(`
        SELECT id, variant_id, product_name, quantity, unit_price, line_total
        FROM shop_order_items
        WHERE order_id = ?
      `, [order.id]);
      order.items = items;
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('[getPendingPickups error]', error);
    res.status(500).json({ success: false, message: 'Server error fetching pending pickups' });
  }
};

const fulfillOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query('SELECT status, order_no FROM shop_orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (orders[0].status === 'completed') {
      return res.status(400).json({ success: false, message: 'Order is already marked completed' });
    }

    await pool.query(`
      UPDATE shop_orders 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW() 
      WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: `Order #${orders[0].order_no} fulfilled and handed to customer`
    });
  } catch (error) {
    console.error('[fulfillOrder error]', error);
    res.status(500).json({ success: false, message: 'Server error fulfilling order' });
  }
};

// ============================================
// 4. Returns & Exchanges
// ============================================

const processReturn = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const staffId = req.user.id;
    const { id } = req.params; // order id
    const { item_ids, reason = 'Customer return' } = req.body;

    const [orders] = await connection.query('SELECT * FROM shop_orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orders[0];

    await connection.beginTransaction();

    let totalRefund = 0;
    const refundedItems = [];

    // Fetch order items to refund
    let itemsQuery = 'SELECT * FROM shop_order_items WHERE order_id = ?';
    let params = [id];
    if (item_ids && Array.isArray(item_ids) && item_ids.length > 0) {
      itemsQuery += ' AND id IN (?)';
      params.push(item_ids);
    }

    const [items] = await connection.query(itemsQuery, params);
    if (items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No items eligible for return' });
    }

    for (const item of items) {
      totalRefund += Number(item.line_total);
      refundedItems.push(item);

      // Fetch variant to get current stock
      const [variantRows] = await connection.query(
        'SELECT stock_on_hand FROM product_variants WHERE id = ? FOR UPDATE',
        [item.variant_id]
      );

      const currentStock = variantRows.length > 0 ? variantRows[0].stock_on_hand : 0;
      const newStock = currentStock + item.quantity;

      // Restock physical inventory
      await connection.query(
        'UPDATE product_variants SET stock_on_hand = ? WHERE id = ?',
        [newStock, item.variant_id]
      );

      // Log Stock Movement
      await connection.query(`
        INSERT INTO stock_movements (
          variant_id, quantity_change, reason, reference_type, reference_id,
          balance_after, notes, performed_by, created_at
        ) VALUES (?, ?, 'return', 'shop_order', ?, ?, ?, ?, NOW())
      `, [item.variant_id, item.quantity, id, newStock, `Return for Order #${order.order_no}: ${reason}`, staffId]);
    }

    // Update order notes
    await connection.query(
      "UPDATE shop_orders SET notes = CONCAT(COALESCE(notes, ''), ' [Returned: ', ?, ']'), updated_at = NOW() WHERE id = ?",
      [reason, id]
    );

    // Look for matching invoice and record refund
    const [invoices] = await connection.query('SELECT id FROM invoices WHERE invoice_no = ?', ['INV-' + order.order_no]);
    if (invoices.length > 0) {
      const invoiceId = invoices[0].id;
      const [payments] = await connection.query('SELECT id, method FROM payments WHERE invoice_id = ? LIMIT 1', [invoiceId]);
      const paymentId = payments.length > 0 ? payments[0].id : null;
      const method = payments.length > 0 ? payments[0].method : 'cash';

      if (paymentId) {
        await connection.query(`
          INSERT INTO refunds (payment_id, amount, method, reason, refunded_by, refunded_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [paymentId, totalRefund, method, reason, staffId]);
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Items returned and restocked successfully',
      refund_amount: totalRefund,
      items_returned: refundedItems.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('[processReturn error]', error);
    res.status(500).json({ success: false, message: 'Server error processing return' });
  } finally {
    connection.release();
  }
};

// ============================================
// 5. Shop Stats (Dashboard KPIs)
// ============================================

const getStats = async (req, res) => {
  try {
    const [todaySales] = await pool.query(`
      SELECT 
        COUNT(*) as orders_count,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM shop_orders
      WHERE DATE(placed_at) = CURDATE() AND status != 'cancelled'
    `);

    const [pendingPickups] = await pool.query(`
      SELECT COUNT(*) as pending_count
      FROM shop_orders
      WHERE status IN ('pending', 'confirmed', 'ready_for_pickup')
    `);

    const [lowStock] = await pool.query(`
      SELECT COUNT(*) as low_stock_count
      FROM product_variants
      WHERE stock_on_hand <= COALESCE(reorder_level, 5) AND is_active = 1
    `);

    const [recentOrders] = await pool.query(`
      SELECT 
        o.id,
        o.order_no,
        o.total_amount,
        o.status,
        o.channel,
        o.placed_at,
        COALESCE(u.full_name, 'Guest Customer') as customer_name
      FROM shop_orders o
      LEFT JOIN members mem ON o.member_id = mem.id
      LEFT JOIN users u ON mem.user_id = u.id
      ORDER BY o.placed_at DESC
      LIMIT 8
    `);

    res.status(200).json({
      success: true,
      data: {
        todayOrders: Number(todaySales[0].orders_count || 0),
        todayRevenue: Number(todaySales[0].total_revenue || 0),
        pendingPickups: Number(pendingPickups[0].pending_count || 0),
        lowStockItems: Number(lowStock[0].low_stock_count || 0),
        recentOrders
      }
    });
  } catch (error) {
    console.error('[getStats error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving shop stats' });
  }
};

module.exports = {
  getCatalog,
  getVariantBySku,
  processInStoreSale,
  getPendingPickups,
  fulfillOrder,
  processReturn,
  getStats
};
