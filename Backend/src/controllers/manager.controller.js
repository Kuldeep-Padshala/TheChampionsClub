const { pool } = require('../config/db');

// ============================================
// 1. OPERATIONS & CONFIGURATION
// ============================================

// Courts Management
async function getCourts(req, res) {
  try {
    const [courts] = await pool.query(`
      SELECT c.*, s.name as sport_name 
      FROM courts c 
      LEFT JOIN sports s ON c.sport_id = s.id 
      ORDER BY c.sport_id ASC, c.id ASC
    `);
    res.json({ success: true, data: courts });
  } catch (error) {
    console.error('[manager getCourts]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courts' });
  }
}

async function updateCourt(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    await pool.query(
      `UPDATE courts 
       SET status = COALESCE(?, status), 
           notes = COALESCE(?, notes), 
           updated_at = NOW() 
       WHERE id = ?`,
      [status || null, notes !== undefined ? notes : null, id]
    );

    const [updated] = await pool.query('SELECT * FROM courts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Court operational status updated', data: updated[0] });
  } catch (error) {
    console.error('[manager updateCourt]', error);
    res.status(500).json({ success: false, message: 'Failed to update court status' });
  }
}

// Court Rates & Tariffs
async function getCourtRates(req, res) {
  try {
    const [rates] = await pool.query(`
      SELECT cr.*, s.name as sport_name, p.name as plan_name, p.code as plan_code 
      FROM court_rates cr 
      JOIN sports s ON cr.sport_id = s.id 
      LEFT JOIN membership_plans p ON cr.plan_id = p.id 
      ORDER BY cr.sport_id ASC, cr.plan_id ASC, cr.id ASC
    `);
    res.json({ success: true, data: rates });
  } catch (error) {
    console.error('[manager getCourtRates]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch court rates' });
  }
}

async function updateCourtRate(req, res) {
  try {
    const { id } = req.params;
    const { price, is_active } = req.body;

    await pool.query(
      `UPDATE court_rates 
       SET price = COALESCE(?, price), 
           is_active = COALESCE(?, is_active) 
       WHERE id = ?`,
      [price !== undefined ? price : null, is_active !== undefined ? is_active : null, id]
    );

    res.json({ success: true, message: 'Court tariff updated successfully' });
  } catch (error) {
    console.error('[manager updateCourtRate]', error);
    res.status(500).json({ success: false, message: 'Failed to update court rate' });
  }
}

// Pro Shop Inventory Control
async function getInventory(req, res) {
  try {
    const [items] = await pool.query(`
      SELECT 
        pv.id,
        pv.product_id,
        pv.sku,
        pv.barcode,
        pv.size,
        pv.color,
        pv.price_override,
        pv.stock_on_hand,
        pv.stock_reserved,
        pv.reorder_level,
        pv.is_active,
        p.name as product_name,
        p.brand,
        p.base_price,
        p.category_id,
        pc.name as category_name
      FROM product_variants pv 
      JOIN products p ON pv.product_id = p.id 
      LEFT JOIN product_categories pc ON p.category_id = pc.id 
      ORDER BY p.name ASC, pv.sku ASC
    `);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('[manager getInventory]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
}

async function adjustInventory(req, res) {
  try {
    const managerId = req.user.id;
    const { variant_id, quantity_change, reason, notes } = req.body;
    const change = Number(quantity_change) || 0;

    const [vars] = await pool.query('SELECT stock_on_hand FROM product_variants WHERE id = ?', [variant_id]);
    if (vars.length === 0) {
      return res.status(404).json({ success: false, message: 'Product variant not found' });
    }

    const currentStock = Number(vars[0].stock_on_hand) || 0;
    const newBalance = currentStock + change;

    // Update variant stock
    await pool.query(
      'UPDATE product_variants SET stock_on_hand = ?, updated_at = NOW() WHERE id = ?',
      [newBalance, variant_id]
    );

    // Record stock movement audit
    await pool.query(
      `INSERT INTO stock_movements (variant_id, quantity_change, reason, reference_type, balance_after, notes, performed_by, created_at)
       VALUES (?, ?, ?, 'manual_adjustment', ?, ?, ?, NOW())`,
      [variant_id, change, reason || 'Stock Adjustment', newBalance, notes || '', managerId]
    );

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      previous_stock: currentStock,
      new_stock: newBalance,
    });
  } catch (error) {
    console.error('[manager adjustInventory]', error);
    res.status(500).json({ success: false, message: 'Failed to adjust inventory' });
  }
}

async function getStockMovements(req, res) {
  try {
    const [movements] = await pool.query(`
      SELECT 
        sm.*, 
        pv.sku, 
        pv.size,
        p.name as product_name, 
        u.full_name as performed_by_name 
      FROM stock_movements sm 
      JOIN product_variants pv ON sm.variant_id = pv.id 
      JOIN products p ON pv.product_id = p.id 
      LEFT JOIN users u ON sm.performed_by = u.id 
      ORDER BY sm.created_at DESC 
      LIMIT 50
    `);
    res.json({ success: true, data: movements });
  } catch (error) {
    console.error('[manager getStockMovements]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock movements' });
  }
}

// Cafe & Lounge Menu Control
async function getBarMenu(req, res) {
  try {
    const [items] = await pool.query(`
      SELECT bmi.*, bmc.name as category_name 
      FROM bar_menu_items bmi 
      LEFT JOIN bar_menu_categories bmc ON bmi.category_id = bmc.id 
      ORDER BY bmi.category_id ASC, bmi.id ASC
    `);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('[manager getBarMenu]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bar menu' });
  }
}

async function updateBarMenu(req, res) {
  try {
    const { id } = req.params;
    const { price, is_available, is_active } = req.body;

    await pool.query(
      `UPDATE bar_menu_items 
       SET price = COALESCE(?, price), 
           is_available = COALESCE(?, is_available), 
           is_active = COALESCE(?, is_active), 
           updated_at = NOW() 
       WHERE id = ?`,
      [
        price !== undefined ? price : null,
        is_available !== undefined ? is_available : null,
        is_active !== undefined ? is_active : null,
        id,
      ]
    );

    res.json({ success: true, message: 'Menu item updated successfully' });
  } catch (error) {
    console.error('[manager updateBarMenu]', error);
    res.status(500).json({ success: false, message: 'Failed to update bar menu item' });
  }
}

// ============================================
// 2. OVERRIDES & CORRECTIONS ("THE BOSS ACTIONS")
// ============================================

async function forceBookCourt(req, res) {
  try {
    const { court_id, member_id, starts_at, ends_at, reservation_type, notes } = req.body;

    if (!court_id || !starts_at || !ends_at) {
      return res.status(400).json({ success: false, message: 'Court, start time, and end time are required' });
    }

    const bookingRef = 'OVR-' + Math.floor(100000 + Math.random() * 900000);

    // 1. Force Create Reservation (bypasses any limits or clash checks)
    const [reservationResult] = await pool.query(
      `INSERT INTO court_reservations (court_id, starts_at, ends_at, reservation_type, status, block_reason, created_by, created_at) 
       VALUES (?, ?, ?, ?, 'active', ?, ?, NOW())`,
      [court_id, starts_at, ends_at, reservation_type || 'exclusive', notes || 'Manager Override Reservation', req.user.id]
    );

    // 2. Create Booking
    const [bookingResult] = await pool.query(
      `INSERT INTO bookings (reservation_id, reservation_type, member_id, booking_ref, booked_via, is_trial, price_basis, amount_charged, status, notes, booked_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'front_desk', 0, 'complimentary', 0.00, 'confirmed', ?, ?, NOW(), NOW())`,
      [reservationResult.insertId, reservation_type || 'exclusive', member_id || 1, bookingRef, notes || 'Manager Override Booking', req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Court force-booked by Manager override successfully',
      bookingId: bookingResult.insertId,
      bookingRef,
    });
  } catch (error) {
    console.error('[manager forceBookCourt]', error);
    res.status(500).json({ success: false, message: 'Failed to force-book court' });
  }
}

async function voidInvoice(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;

    await pool.query(
      `UPDATE invoices 
       SET status = 'Void', 
           balance_due = 0, 
           voided_by = ?,
           voided_at = NOW(),
           void_reason = ?,
           notes = CONCAT(COALESCE(notes, ''), ' | Voided by Manager: ', ?) 
       WHERE id = ?`,
      [managerId, reason || 'Manager Override Void', reason || 'Manager Override Void', id]
    );

    res.json({ success: true, message: `Invoice #${id} successfully voided` });
  } catch (error) {
    console.error('[manager voidInvoice]', error);
    res.status(500).json({ success: false, message: 'Failed to void invoice' });
  }
}

async function getInvoices(req, res) {
  try {
    const [invoices] = await pool.query(`
      SELECT 
        inv.*, 
        m.member_code, 
        m.full_name as member_name,
        m.phone as member_phone
      FROM invoices inv 
      LEFT JOIN members m ON inv.member_id = m.id 
      ORDER BY inv.created_at DESC 
      LIMIT 100
    `);
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('[manager getInvoices]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
}

// ============================================
// 3. STAFF & SHIFT MANAGEMENT (HR)
// ============================================

async function getEmployees(req, res) {
  try {
    const [employees] = await pool.query(`
      SELECT 
        e.*, 
        u.full_name as user_full_name, 
        u.email as user_email, 
        u.phone as user_phone 
      FROM employees e 
      LEFT JOIN users u ON e.user_id = u.id 
      ORDER BY e.department ASC, e.full_name ASC
    `);
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('[manager getEmployees]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
}

async function getShifts(req, res) {
  try {
    const [shifts] = await pool.query(`
      SELECT 
        s.*, 
        e.full_name as employee_name, 
        e.employee_code, 
        e.job_title 
      FROM shifts s 
      JOIN employees e ON s.employee_id = e.id 
      ORDER BY s.starts_at DESC 
      LIMIT 100
    `);
    res.json({ success: true, data: shifts });
  } catch (error) {
    console.error('[manager getShifts]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shifts' });
  }
}

async function createShift(req, res) {
  try {
    const managerId = req.user.id;
    const { employee_id, department, starts_at, ends_at, notes } = req.body;

    if (!employee_id || !starts_at || !ends_at) {
      return res.status(400).json({ success: false, message: 'Employee, start time, and end time are required' });
    }

    const [shift] = await pool.query(
      `INSERT INTO shifts (employee_id, department, starts_at, ends_at, status, notes, created_by, created_at) 
       VALUES (?, ?, ?, ?, 'scheduled', ?, ?, NOW())`,
      [employee_id, department || 'operations', starts_at, ends_at, notes || null, managerId]
    );

    res.status(201).json({ success: true, message: 'Shift created successfully', shiftId: shift.insertId });
  } catch (error) {
    console.error('[manager createShift]', error);
    res.status(500).json({ success: false, message: 'Failed to create shift' });
  }
}

async function getLeaves(req, res) {
  try {
    const [leaves] = await pool.query(`
      SELECT 
        lr.*, 
        e.full_name as employee_name, 
        e.employee_code, 
        e.job_title,
        e.department,
        lt.name as leave_type_name, 
        u.full_name as reviewer_name 
      FROM leave_requests lr 
      JOIN employees e ON lr.employee_id = e.id 
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id 
      LEFT JOIN users u ON lr.decided_by = u.id 
      ORDER BY lr.requested_at DESC
    `);
    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('[manager getLeaves]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests' });
  }
}

async function getLeaveTypes(req, res) {
  try {
    const [types] = await pool.query('SELECT * FROM leave_types WHERE is_active = 1');
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('[manager getLeaveTypes]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave types' });
  }
}

async function approveLeave(req, res) {
  try {
    const { id } = req.params;
    const { status, decision_note } = req.body; // status: "approved" or "rejected"
    const managerId = req.user.id;

    await pool.query(
      `UPDATE leave_requests 
       SET status = ?, 
           decision_note = ?, 
           decided_by = ?, 
           decided_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [status || 'approved', decision_note || null, managerId, id]
    );

    res.json({ success: true, message: `Leave application marked as ${status}` });
  } catch (error) {
    console.error('[manager approveLeave]', error);
    res.status(500).json({ success: false, message: 'Failed to update leave status' });
  }
}

// ============================================
// 4. FINANCIAL REPORTING & END-OF-DAY
// ============================================

async function getDailySummary(req, res) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Payments grouped by method for the day
    const [payments] = await pool.query(
      `SELECT method as payment_method, SUM(amount) as total, COUNT(*) as count 
       FROM payments 
       WHERE DATE(paid_at) = ? AND status IN ('success', 'Successful', 'paid', 'Paid') 
       GROUP BY method`,
      [date]
    );

    // Invoices issued on this day grouped by status
    const [invoiceSummary] = await pool.query(
      `SELECT status, SUM(total_amount) as total, COUNT(*) as count 
       FROM invoices 
       WHERE DATE(issue_date) = ? 
       GROUP BY status`,
      [date]
    );

    // Daily KPIs
    const [totalRevenueRow] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM payments 
       WHERE DATE(paid_at) = ? AND status IN ('success', 'Successful', 'paid', 'Paid')`,
      [date]
    );

    const [outstandingDuesRow] = await pool.query(
      `SELECT COALESCE(SUM(balance_due), 0) as total 
       FROM invoices 
       WHERE balance_due > 0 AND status != 'Void'`
    );

    const [activeMembersRow] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM memberships 
       WHERE status = 'active' AND end_date >= CURDATE()`
    );

    const [todayBookingsRow] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM court_reservations 
       WHERE DATE(starts_at) = ? AND status != 'Cancelled'`,
      [date]
    );

    const [todayCheckinsRow] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM check_ins 
       WHERE DATE(checked_in_at) = ?`,
      [date]
    );

    res.json({
      success: true,
      date,
      total_revenue: Number(totalRevenueRow[0]?.total || 0),
      outstanding_dues: Number(outstandingDuesRow[0]?.total || 0),
      active_members: Number(activeMembersRow[0]?.count || 0),
      today_bookings: Number(todayBookingsRow[0]?.count || 0),
      today_checkins: Number(todayCheckinsRow[0]?.count || 0),
      payment_breakdown: payments,
      invoice_breakdown: invoiceSummary,
    });
  } catch (error) {
    console.error('[manager getDailySummary]', error);
    res.status(500).json({ success: false, message: 'Failed to generate daily financial summary' });
  }
}

async function getDailyClosings(req, res) {
  try {
    const [closings] = await pool.query(`
      SELECT dc.*, u.full_name as closed_by_name 
      FROM daily_closings dc 
      LEFT JOIN users u ON dc.closed_by = u.id 
      ORDER BY dc.business_date DESC 
      LIMIT 30
    `);
    res.json({ success: true, data: closings });
  } catch (error) {
    console.error('[manager getDailyClosings]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch daily closings' });
  }
}

async function closeRegister(req, res) {
  try {
    const managerId = req.user.id;
    const {
      business_date,
      department,
      total_sales,
      cash_total,
      card_total,
      upi_total,
      online_total,
      opening_cash,
      expected_cash,
      counted_cash,
      notes,
    } = req.body;

    const bDate = business_date || new Date().toISOString().split('T')[0];
    const expCash = Number(expected_cash) || 0;
    const cntCash = Number(counted_cash) || 0;
    const discrepancy = cntCash - expCash;

    const [closing] = await pool.query(
      `INSERT INTO daily_closings 
        (business_date, department, total_sales, cash_total, card_total, upi_total, online_total, opening_cash, expected_cash, counted_cash, cash_variance, closed_by, closed_at, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        bDate,
        department || 'all',
        Number(total_sales) || 0,
        Number(cash_total) || 0,
        Number(card_total) || 0,
        Number(upi_total) || 0,
        Number(online_total) || 0,
        Number(opening_cash) || 0,
        expCash,
        cntCash,
        discrepancy,
        managerId,
        notes || '',
      ]
    );

    res.status(201).json({
      success: true,
      message: 'End-of-day register closed and verified successfully',
      closingId: closing.insertId,
      discrepancy,
    });
  } catch (error) {
    console.error('[manager closeRegister]', error);
    res.status(500).json({ success: false, message: 'Failed to close register' });
  }
}

module.exports = {
  // Operations & Config
  getCourts,
  updateCourt,
  getCourtRates,
  updateCourtRate,
  getInventory,
  adjustInventory,
  getStockMovements,
  getBarMenu,
  updateBarMenu,

  // Overrides & Boss Actions
  forceBookCourt,
  voidInvoice,
  getInvoices,

  // HR & Staff
  getEmployees,
  getShifts,
  createShift,
  getLeaves,
  getLeaveTypes,
  approveLeave,

  // Financial & End-of-Day
  getDailySummary,
  getDailyClosings,
  closeRegister,
};
