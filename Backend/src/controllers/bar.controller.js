const { pool } = require('../config/db');

// Helper to format order number
function generateOrderNo() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `BO-${dateStr}-${rand}`;
}

// Helper to format tab number
function generateTabNo() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10 + Math.random() * 90);
  return `TAB-${dateStr}-${rand}`;
}

// Helper to format invoice number
function generateInvoiceNo() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-BAR-${dateStr}-${rand}`;
}

// Helper to format receipt number
function generateReceiptNo() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RC-BAR-${dateStr}-${rand}`;
}

// ══════════════════════════════════════════════════════════════
// 1. MENU & CATEGORIES
// ══════════════════════════════════════════════════════════════

async function getCategories(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, sort_order, is_active FROM bar_menu_categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[bar.getCategories]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
}

async function getMenu(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT bmi.*, bmc.name as category_name 
       FROM bar_menu_items bmi 
       LEFT JOIN bar_menu_categories bmc ON bmi.category_id = bmc.id 
       WHERE bmi.is_active = 1 
       ORDER BY bmc.sort_order ASC, bmi.name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[bar.getMenu]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
}

async function updateMenuAvailability(req, res) {
  try {
    const itemId = req.params.id;
    const { is_available, price } = req.body;

    const updates = [];
    const params = [];

    if (is_available !== undefined) {
      updates.push('is_available = ?');
      params.push(is_available ? 1 : 0);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(Number(price));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');
    params.push(itemId);

    await pool.query(
      `UPDATE bar_menu_items SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Menu item updated' });
  } catch (err) {
    console.error('[bar.updateMenuAvailability]', err);
    res.status(500).json({ success: false, message: 'Failed to update item availability' });
  }
}

// ══════════════════════════════════════════════════════════════
// 2. DINING TABLES & FLOOR PLAN
// ══════════════════════════════════════════════════════════════

async function getTables(req, res) {
  try {
    const [tables] = await pool.query(
      `SELECT dt.*, 
              bt.id as active_tab_id, bt.tab_no, bt.guest_name,
              m.full_name as member_name
       FROM dining_tables dt
       LEFT JOIN bar_tabs bt ON dt.id = bt.table_id AND bt.status = 'open'
       LEFT JOIN members m ON bt.member_id = m.id
       ORDER BY dt.table_number ASC`
    );
    res.json({ success: true, data: tables });
  } catch (err) {
    console.error('[bar.getTables]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dining tables' });
  }
}

async function updateTableStatus(req, res) {
  try {
    const tableId = req.params.id;
    const { status } = req.body;

    if (!['free', 'occupied', 'cleaning', 'reserved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid table status' });
    }

    await pool.query('UPDATE dining_tables SET status = ? WHERE id = ?', [status, tableId]);
    res.json({ success: true, message: `Table status updated to ${status}` });
  } catch (err) {
    console.error('[bar.updateTableStatus]', err);
    res.status(500).json({ success: false, message: 'Failed to update table status' });
  }
}

// ══════════════════════════════════════════════════════════════
// 3. BAR TABS
// ══════════════════════════════════════════════════════════════

async function getTabs(req, res) {
  try {
    const status = req.query.status || 'open';
    const params = [];
    let whereClause = '';

    if (status !== 'all') {
      whereClause = 'WHERE bt.status = ?';
      params.push(status);
    }

    const [tabs] = await pool.query(
      `SELECT bt.*, 
              dt.table_number, dt.zone,
              m.full_name as member_name, m.member_code,
              u.full_name as opened_by_name,
              COALESCE(SUM(bo.total_amount), 0) as tab_total,
              COUNT(bo.id) as order_count
       FROM bar_tabs bt
       LEFT JOIN dining_tables dt ON bt.table_id = dt.id
       LEFT JOIN members m ON bt.member_id = m.id
       LEFT JOIN users u ON bt.opened_by = u.id
       LEFT JOIN bar_orders bo ON bt.id = bo.tab_id AND bo.status != 'cancelled'
       ${whereClause}
       GROUP BY bt.id
       ORDER BY bt.opened_at DESC`,
      params
    );

    res.json({ success: true, data: tabs });
  } catch (err) {
    console.error('[bar.getTabs]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bar tabs' });
  }
}

async function openTab(req, res) {
  try {
    const { member_id, guest_name, table_id } = req.body;
    const openedBy = req.user.id;
    const tabNo = generateTabNo();

    const [result] = await pool.query(
      `INSERT INTO bar_tabs (tab_no, member_id, guest_id, guest_name, table_id, status, opened_by, opened_at)
       VALUES (?, ?, NULL, ?, ?, 'open', ?, NOW())`,
      [tabNo, member_id || null, guest_name || null, table_id || null, openedBy]
    );

    // If table assigned, mark table as occupied
    if (table_id) {
      await pool.query('UPDATE dining_tables SET status = \'occupied\' WHERE id = ?', [table_id]);
    }

    res.json({
      success: true,
      message: `Tab ${tabNo} opened successfully`,
      tabId: result.insertId,
      tabNo,
    });
  } catch (err) {
    console.error('[bar.openTab]', err);
    res.status(500).json({ success: false, message: 'Failed to open bar tab' });
  }
}

async function settleTab(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const tabId = req.params.id;
    const { method = 'upi', notes } = req.body;
    const closedBy = req.user.id;

    const [tabs] = await connection.query('SELECT * FROM bar_tabs WHERE id = ? FOR UPDATE', [tabId]);
    if (tabs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Tab not found' });
    }
    const tab = tabs[0];
    if (tab.status === 'settled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Tab is already settled' });
    }

    // Get all orders on this tab
    const [orders] = await connection.query(
      'SELECT * FROM bar_orders WHERE tab_id = ? AND status != \'cancelled\'',
      [tabId]
    );

    const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const subtotal = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);
    const discountTotal = orders.reduce((sum, o) => sum + Number(o.discount_total), 0);
    const taxTotal = orders.reduce((sum, o) => sum + Number(o.tax_total), 0);

    // Create invoice if orders have positive total
    let invoiceId = null;
    let receiptNo = null;

    if (totalAmount > 0) {
      const invoiceNo = generateInvoiceNo();
      const billToName = tab.guest_name || (tab.member_id ? `Member #${tab.member_id}` : 'Walk-in Guest');

      const [invResult] = await connection.query(
        `INSERT INTO invoices (invoice_no, member_id, bill_to_name, status, issue_date, due_date, subtotal, discount_total, tax_total, total_amount, amount_paid, balance_due, notes, issued_by, created_at, updated_at)
         VALUES (?, ?, ?, 'paid', CURDATE(), CURDATE(), ?, ?, ?, ?, ?, 0.00, ?, ?, NOW(), NOW())`,
        [invoiceNo, tab.member_id || null, billToName, subtotal, discountTotal, taxTotal, totalAmount, totalAmount, notes || `Settlement of ${tab.tab_no}`, closedBy]
      );
      invoiceId = invResult.insertId;

      // Create payment
      receiptNo = generateReceiptNo();
      await connection.query(
        `INSERT INTO payments (receipt_no, invoice_id, amount, method, status, received_by, paid_at, notes, created_at)
         VALUES (?, ?, ?, ?, 'success', ?, NOW(), ?, NOW())`,
        [receiptNo, invoiceId, totalAmount, method, closedBy, `Payment for ${tab.tab_no}`]
      );
    }

    // Mark tab settled
    await connection.query(
      'UPDATE bar_tabs SET status = \'settled\', settled_at = NOW(), closed_by = ? WHERE id = ?',
      [closedBy, tabId]
    );

    // Mark all orders on tab as served if not already
    await connection.query(
      'UPDATE bar_orders SET status = \'served\', served_at = COALESCE(served_at, NOW()) WHERE tab_id = ? AND status != \'cancelled\'',
      [tabId]
    );

    // Release table
    if (tab.table_id) {
      await connection.query('UPDATE dining_tables SET status = \'cleaning\' WHERE id = ?', [tab.table_id]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Tab ${tab.tab_no} settled successfully for ₹${totalAmount.toLocaleString()}`,
      totalAmount,
      invoiceId,
      receiptNo,
    });
  } catch (err) {
    await connection.rollback();
    console.error('[bar.settleTab]', err);
    res.status(500).json({ success: false, message: 'Failed to settle bar tab' });
  } finally {
    connection.release();
  }
}

// ══════════════════════════════════════════════════════════════
// 4. ORDERS & KITCHEN DISPLAY SYSTEM (KDS)
// ══════════════════════════════════════════════════════════════

async function getOrders(req, res) {
  try {
    const status = req.query.status;
    const date = req.query.date;

    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('bo.status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push('DATE(bo.placed_at) = ?');
      params.push(date);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [orders] = await pool.query(
      `SELECT bo.*, 
              dt.table_number, dt.zone,
              bt.tab_no, bt.guest_name,
              m.full_name as member_name, m.member_code,
              u.full_name as taken_by_name
       FROM bar_orders bo
       LEFT JOIN dining_tables dt ON bo.table_id = dt.id
       LEFT JOIN bar_tabs bt ON bo.tab_id = bt.id
       LEFT JOIN members m ON bo.member_id = m.id
       LEFT JOIN users u ON bo.taken_by = u.id
       ${where}
       ORDER BY bo.placed_at DESC`,
      params
    );

    // Fetch items for each order
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const [items] = await pool.query(
        `SELECT boi.*, bmi.name as menu_name, bmi.image_url 
         FROM bar_order_items boi
         LEFT JOIN bar_menu_items bmi ON boi.menu_item_id = bmi.id
         WHERE boi.order_id IN (?)
         ORDER BY boi.id ASC`,
        [orderIds]
      );

      const itemsByOrder = {};
      items.forEach((it) => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push(it);
      });

      orders.forEach((o) => {
        o.items = itemsByOrder[o.id] || [];
      });
    }

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('[bar.getOrders]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bar orders' });
  }
}

async function createOrder(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      table_id,
      tab_id,
      member_id,
      guest_name,
      notes,
      items, // array of { menu_item_id, quantity, special_instructions }
    } = req.body;

    const takenBy = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Lookup member discount if member_id is provided
    let discountPct = 0;
    if (member_id) {
      const [mRows] = await connection.query(
        `SELECT p.bar_discount_pct 
         FROM members m 
         JOIN memberships ms ON m.id = ms.member_id AND ms.status = 'active'
         JOIN membership_plans p ON ms.plan_id = p.id
         WHERE m.id = ? LIMIT 1`,
        [member_id]
      );
      if (mRows.length > 0) {
        discountPct = Number(mRows[0].bar_discount_pct || 0);
      }
    }

    // Fetch menu items to calculate prices
    const itemIds = items.map((i) => i.menu_item_id);
    const [menuRows] = await connection.query(
      'SELECT id, name, price, station, tax_rate_id FROM bar_menu_items WHERE id IN (?)',
      [itemIds]
    );

    const menuMap = {};
    menuRows.forEach((m) => {
      menuMap[m.id] = m;
    });

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    const preparedItems = [];

    for (const reqItem of items) {
      const menuItem = menuMap[reqItem.menu_item_id];
      if (!menuItem) continue;

      const qty = Math.max(1, parseInt(reqItem.quantity) || 1);
      const unitPrice = Number(menuItem.price);
      const lineSubtotal = unitPrice * qty;

      const lineDiscount = discountPct > 0 ? (lineSubtotal * discountPct) / 100 : 0;
      const discountedLine = lineSubtotal - lineDiscount;

      // 5% standard restaurant GST
      const lineTax = (discountedLine * 5) / 100;
      const lineTotal = discountedLine + lineTax;

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;

      preparedItems.push({
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: qty,
        unit_price: unitPrice,
        discount_amount: lineDiscount,
        tax_rate_id: menuItem.tax_rate_id || 2,
        tax_amount: lineTax,
        station: menuItem.station || 'kitchen',
        kitchen_status: 'pending',
        special_instructions: reqItem.special_instructions || null,
        line_total: lineTotal,
      });
    }

    const totalAmount = subtotal - discountTotal + taxTotal;
    const orderNo = generateOrderNo();

    // Create Bar Order
    const [orderResult] = await connection.query(
      `INSERT INTO bar_orders (order_no, tab_id, table_id, member_id, guest_id, taken_by, status, member_discount_pct, subtotal, discount_total, tax_total, total_amount, notes, placed_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, 'placed', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderNo,
        tab_id || null,
        table_id || null,
        member_id || null,
        takenBy,
        discountPct,
        subtotal,
        discountTotal,
        taxTotal,
        totalAmount,
        notes || null,
      ]
    );

    const orderId = orderResult.insertId;

    // Insert Order Items
    for (const pi of preparedItems) {
      await connection.query(
        `INSERT INTO bar_order_items (order_id, menu_item_id, item_name, quantity, unit_price, discount_amount, tax_rate_id, tax_amount, station, kitchen_status, special_instructions, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          pi.menu_item_id,
          pi.item_name,
          pi.quantity,
          pi.unit_price,
          pi.discount_amount,
          pi.tax_rate_id,
          pi.tax_amount,
          pi.station,
          pi.kitchen_status,
          pi.special_instructions,
          pi.line_total,
        ]
      );
    }

    // If dining table specified, update table status to occupied
    if (table_id) {
      await connection.query('UPDATE dining_tables SET status = \'occupied\' WHERE id = ?', [table_id]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Order ${orderNo} dispatched to kitchen & bar station`,
      orderId,
      orderNo,
      totalAmount,
    });
  } catch (err) {
    await connection.rollback();
    console.error('[bar.createOrder]', err);
    res.status(500).json({ success: false, message: 'Failed to create bar order' });
  } finally {
    connection.release();
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!['placed', 'preparing', 'ready', 'served', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const servedSql = status === 'served' ? ', served_at = NOW()' : '';

    await pool.query(
      `UPDATE bar_orders SET status = ?, updated_at = NOW() ${servedSql} WHERE id = ?`,
      [status, orderId]
    );

    // Sync kitchen status of items
    const itemStatus = status === 'served' ? 'served' : status === 'ready' ? 'ready' : status === 'preparing' ? 'preparing' : 'pending';
    await pool.query('UPDATE bar_order_items SET kitchen_status = ? WHERE order_id = ?', [itemStatus, orderId]);

    res.json({ success: true, message: `Order updated to ${status}` });
  } catch (err) {
    console.error('[bar.updateOrderStatus]', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
}

async function cancelOrder(req, res) {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;

    await pool.query(
      `UPDATE bar_orders 
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = ?, updated_at = NOW() 
       WHERE id = ?`,
      [reason || 'Cancelled by staff', orderId]
    );

    await pool.query('UPDATE bar_order_items SET kitchen_status = \'cancelled\' WHERE order_id = ?', [orderId]);

    res.json({ success: true, message: 'Order has been cancelled' });
  } catch (err) {
    console.error('[bar.cancelOrder]', err);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
}

// ══════════════════════════════════════════════════════════════
// 5. DIRECT COUNTER CHECKOUT (QUICK SALE)
// ══════════════════════════════════════════════════════════════

async function directCheckout(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      member_id,
      guest_name,
      payment_method = 'upi',
      notes,
      items,
    } = req.body;

    const takenBy = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Order must contain items' });
    }

    // Lookup member discount
    let discountPct = 0;
    let memberName = guest_name || 'Walk-in Guest';
    if (member_id) {
      const [mRows] = await connection.query(
        `SELECT m.full_name, p.bar_discount_pct 
         FROM members m 
         JOIN memberships ms ON m.id = ms.member_id AND ms.status = 'active'
         JOIN membership_plans p ON ms.plan_id = p.id
         WHERE m.id = ? LIMIT 1`,
        [member_id]
      );
      if (mRows.length > 0) {
        discountPct = Number(mRows[0].bar_discount_pct || 0);
        memberName = mRows[0].full_name;
      }
    }

    // Fetch menu items
    const itemIds = items.map((i) => i.menu_item_id);
    const [menuRows] = await connection.query(
      'SELECT id, name, price, station, tax_rate_id FROM bar_menu_items WHERE id IN (?)',
      [itemIds]
    );

    const menuMap = {};
    menuRows.forEach((m) => {
      menuMap[m.id] = m;
    });

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    const preparedItems = [];

    for (const reqItem of items) {
      const menuItem = menuMap[reqItem.menu_item_id];
      if (!menuItem) continue;

      const qty = Math.max(1, parseInt(reqItem.quantity) || 1);
      const unitPrice = Number(menuItem.price);
      const lineSubtotal = unitPrice * qty;
      const lineDiscount = discountPct > 0 ? (lineSubtotal * discountPct) / 100 : 0;
      const discountedLine = lineSubtotal - lineDiscount;
      const lineTax = (discountedLine * 5) / 100;
      const lineTotal = discountedLine + lineTax;

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;

      preparedItems.push({
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: qty,
        unit_price: unitPrice,
        discount_amount: lineDiscount,
        tax_rate_id: menuItem.tax_rate_id || 2,
        tax_amount: lineTax,
        station: menuItem.station || 'bar',
        line_total: lineTotal,
      });
    }

    const totalAmount = subtotal - discountTotal + taxTotal;
    const orderNo = generateOrderNo();

    // Insert Order (status: 'served')
    const [orderResult] = await connection.query(
      `INSERT INTO bar_orders (order_no, tab_id, table_id, member_id, guest_id, taken_by, status, member_discount_pct, subtotal, discount_total, tax_total, total_amount, notes, placed_at, served_at, updated_at)
       VALUES (?, NULL, NULL, ?, NULL, ?, 'served', ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [orderNo, member_id || null, takenBy, discountPct, subtotal, discountTotal, taxTotal, totalAmount, notes || 'Quick Counter Sale']
    );

    const orderId = orderResult.insertId;

    for (const pi of preparedItems) {
      await connection.query(
        `INSERT INTO bar_order_items (order_id, menu_item_id, item_name, quantity, unit_price, discount_amount, tax_rate_id, tax_amount, station, kitchen_status, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'served', ?)`,
        [orderId, pi.menu_item_id, pi.item_name, pi.quantity, pi.unit_price, pi.discount_amount, pi.tax_rate_id, pi.tax_amount, pi.station, pi.line_total]
      );
    }

    // Generate Invoice & Payment Record
    const invoiceNo = generateInvoiceNo();
    const [invResult] = await connection.query(
      `INSERT INTO invoices (invoice_no, member_id, bill_to_name, status, issue_date, due_date, subtotal, discount_total, tax_total, total_amount, amount_paid, balance_due, notes, issued_by, created_at, updated_at)
       VALUES (?, ?, ?, 'paid', CURDATE(), CURDATE(), ?, ?, ?, ?, ?, 0.00, ?, ?, NOW(), NOW())`,
      [invoiceNo, member_id || null, memberName, subtotal, discountTotal, taxTotal, totalAmount, totalAmount, notes || 'Quick Counter Sale', takenBy]
    );

    const receiptNo = generateReceiptNo();
    await connection.query(
      `INSERT INTO payments (receipt_no, invoice_id, amount, method, status, received_by, paid_at, notes, created_at)
       VALUES (?, ?, ?, ?, 'success', ?, NOW(), ?, NOW())`,
      [receiptNo, invResult.insertId, totalAmount, payment_method, takenBy, `Payment for ${orderNo}`]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Sale completed: ₹${totalAmount.toLocaleString()} received via ${payment_method.toUpperCase()}`,
      orderId,
      orderNo,
      totalAmount,
      receiptNo,
    });
  } catch (err) {
    await connection.rollback();
    console.error('[bar.directCheckout]', err);
    res.status(500).json({ success: false, message: 'Failed to process checkout' });
  } finally {
    connection.release();
  }
}

// ══════════════════════════════════════════════════════════════
// 6. SHIFT STATS & REVENUE OVERVIEW
// ══════════════════════════════════════════════════════════════

async function getStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's total sales
    const [salesRow] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_sales,
              COUNT(id) as total_orders
       FROM bar_orders 
       WHERE DATE(placed_at) = ? AND status != 'cancelled'`,
      [today]
    );

    // Active open tabs
    const [tabsRow] = await pool.query(
      'SELECT COUNT(id) as active_tabs FROM bar_tabs WHERE status = \'open\''
    );

    // Active tables occupied
    const [tablesRow] = await pool.query(
      'SELECT COUNT(id) as occupied_tables FROM dining_tables WHERE status = \'occupied\''
    );

    // Kitchen queue count (placed or preparing)
    const [queueRow] = await pool.query(
      'SELECT COUNT(id) as pending_orders FROM bar_orders WHERE status IN (\'placed\', \'preparing\')'
    );

    res.json({
      success: true,
      data: {
        total_sales: Number(salesRow[0].total_sales || 0),
        total_orders: Number(salesRow[0].total_orders || 0),
        active_tabs: Number(tabsRow[0].active_tabs || 0),
        occupied_tables: Number(tablesRow[0].occupied_tables || 0),
        pending_orders: Number(queueRow[0].pending_orders || 0),
      },
    });
  } catch (err) {
    console.error('[bar.getStats]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bar statistics' });
  }
}

module.exports = {
  getCategories,
  getMenu,
  updateMenuAvailability,
  getTables,
  updateTableStatus,
  getTabs,
  openTab,
  settleTab,
  getOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  directCheckout,
  getStats,
};
