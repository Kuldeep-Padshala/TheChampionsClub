const db = require('../config/db.js');

// ============================================
// 1. POS Setup (Menu & Tables)
// ============================================

const getMenu = async (req, res) => {
  try {
    const [menuItems] = await db.query(`
      SELECT m.*, c.name as category_name 
      FROM bar_menu_items m 
      LEFT JOIN bar_menu_categories c ON m.category_id = c.id 
      WHERE m.is_available = 1
    `);
    
    // Group by category for the frontend
    const groupedMenu = menuItems.reduce((acc, item) => {
      const cat = item.category_name || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    res.status(200).json({ success: true, data: groupedMenu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getTables = async (req, res) => {
  try {
    const [tables] = await db.query('SELECT * FROM dining_tables ORDER BY table_number ASC');
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 2. Tab Management (For Members)
// ============================================

const getOpenTabs = async (req, res) => {
  try {
    const [tabs] = await db.query(`
      SELECT t.*, m.user_id 
      FROM bar_tabs t 
      JOIN members m ON t.member_id = m.id 
      WHERE t.status = 'Open'
    `);
    res.status(200).json({ success: true, data: tabs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const openTab = async (req, res) => {
  try {
    const { member_id, table_id } = req.body;

    const [memberCheck] = await db.query('SELECT id FROM members WHERE id = ?', [member_id]);
    if (memberCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const [tabResult] = await db.query(
      'INSERT INTO bar_tabs (member_id, table_id, status, opened_at, created_at) VALUES (?, ?, ?, NOW(), NOW())',
      [member_id, table_id || null, 'Open']
    );

    // If table assigned, mark table as occupied
    if (table_id) {
      await db.query('UPDATE dining_tables SET status = "Occupied" WHERE id = ?', [table_id]);
    }

    res.status(201).json({ success: true, message: 'Tab opened', tabId: tabResult.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const closeTab = async (req, res) => {
  try {
    const { id } = req.params; // tab_id
    
    // Fetch tab info to get member_id
    const [tabs] = await db.query('SELECT * FROM bar_tabs WHERE id = ? AND status = "Open"', [id]);
    if (tabs.length === 0) {
      return res.status(400).json({ success: false, message: 'Tab is already closed or does not exist' });
    }
    const tab = tabs[0];

    // Calculate total from all orders linked to this tab
    const [orders] = await db.query('SELECT SUM(total_amount) as grand_total FROM bar_orders WHERE tab_id = ?', [id]);
    const grandTotal = orders[0].grand_total || 0;

    // Generate Invoice if total > 0
    let invoiceId = null;
    if (grandTotal > 0) {
      const invoiceNo = 'INV-BAR-' + Date.now();
      const [invoiceResult] = await db.query(
        'INSERT INTO invoices (invoice_no, member_id, total_amount, status, issue_date, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [invoiceNo, tab.member_id, grandTotal, 'Unpaid']
      );
      invoiceId = invoiceResult.insertId;
    }

    // Close Tab
    await db.query('UPDATE bar_tabs SET status = "Closed", closed_at = NOW() WHERE id = ?', [id]);
    
    // Free the table if assigned
    if (tab.table_id) {
      await db.query('UPDATE dining_tables SET status = "Free" WHERE id = ?', [tab.table_id]);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Tab closed successfully', 
      total: grandTotal,
      invoiceId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. Order Taking (KOT)
// ============================================

const createOrder = async (req, res) => {
  try {
    const { table_id, tab_id, items, special_instructions } = req.body;
    // items: array of { menu_item_id, quantity }

    let totalAmount = 0;
    const orderItemsToInsert = [];

    // Calculate total and prepare items
    for (const item of items) {
      const [menuItems] = await db.query('SELECT price FROM bar_menu_items WHERE id = ?', [item.menu_item_id]);
      if (menuItems.length > 0) {
        const price = menuItems[0].price;
        const lineTotal = price * item.quantity;
        totalAmount += lineTotal;
        orderItemsToInsert.push({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: price,
          line_total: lineTotal,
          notes: item.notes || null
        });
      }
    }

    const orderNo = 'KOT-' + Date.now();
    const [orderResult] = await db.query(
      'INSERT INTO bar_orders (order_no, table_id, tab_id, status, total_amount, special_instructions, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [orderNo, table_id || null, tab_id || null, 'Pending', totalAmount, special_instructions || null]
    );
    const orderId = orderResult.insertId;

    // Insert items
    for (const item of orderItemsToInsert) {
      await db.query(
        'INSERT INTO bar_order_items (order_id, menu_item_id, quantity, unit_price, line_total, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.line_total, 'Pending', item.notes]
      );
    }

    res.status(201).json({ success: true, message: 'Order sent to kitchen', orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getActiveOrders = async (req, res) => {
  try {
    // Fetch orders that are not fully completed/served
    const [orders] = await db.query(`
      SELECT o.*, t.table_number 
      FROM bar_orders o 
      LEFT JOIN dining_tables t ON o.table_id = t.id 
      WHERE o.status != 'Completed' AND o.status != 'Cancelled' 
      ORDER BY o.created_at ASC
    `);

    // Attach items to each order
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT i.*, m.name 
        FROM bar_order_items i 
        JOIN bar_menu_items m ON i.menu_item_id = m.id 
        WHERE i.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. Kitchen / Service Tracking
// ============================================

const updateOrderItemStatus = async (req, res) => {
  try {
    const { id } = req.params; // bar_order_item id
    const { status } = req.body; // Pending -> Preparing -> Ready -> Served

    await db.query('UPDATE bar_order_items SET status = ? WHERE id = ?', [status, id]);

    res.status(200).json({ success: true, message: `Item status updated to ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 5. Quick Check-out (Walk-in)
// ============================================

const quickPayOrder = async (req, res) => {
  try {
    const { items, payment_method } = req.body;
    
    // 1. Calculate total and prepare items
    let totalAmount = 0;
    const orderItemsToInsert = [];
    for (const item of items) {
      const [menuItems] = await db.query('SELECT price FROM bar_menu_items WHERE id = ?', [item.menu_item_id]);
      if (menuItems.length > 0) {
        const price = menuItems[0].price;
        const lineTotal = price * item.quantity;
        totalAmount += lineTotal;
        orderItemsToInsert.push({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: price,
          line_total: lineTotal
        });
      }
    }

    // 2. Create Order directly as Completed
    const orderNo = 'WALKIN-' + Date.now();
    const [orderResult] = await db.query(
      'INSERT INTO bar_orders (order_no, status, total_amount, created_at) VALUES (?, ?, ?, NOW())',
      [orderNo, 'Completed', totalAmount]
    );
    const orderId = orderResult.insertId;

    for (const item of orderItemsToInsert) {
      await db.query(
        'INSERT INTO bar_order_items (order_id, menu_item_id, quantity, unit_price, line_total, status) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.line_total, 'Served']
      );
    }

    // 3. Generate Invoice (Paid instantly)
    const invoiceNo = 'INV-' + orderNo;
    const [invoiceResult] = await db.query(
      'INSERT INTO invoices (invoice_no, total_amount, status, issue_date, created_at) VALUES (?, ?, ?, NOW(), NOW())',
      [invoiceNo, totalAmount, 'Paid']
    );

    // 4. Record Payment
    await db.query(
      'INSERT INTO payments (invoice_id, amount, payment_method, status, payment_date, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [invoiceResult.insertId, totalAmount, payment_method || 'Cash', 'Successful']
    );

    res.status(201).json({ success: true, message: 'Quick checkout completed successfully', orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getMenu,
  getTables,
  getOpenTabs,
  openTab,
  closeTab,
  createOrder,
  getActiveOrders,
  updateOrderItemStatus,
  quickPayOrder
};
