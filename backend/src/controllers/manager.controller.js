const db = require('../config/db.js');

// ============================================
// 1. Operations & Configuration
// ============================================

const updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, status } = req.body; // status can be used for Maintenance/Blocked

    await db.query(
      'UPDATE courts SET is_active = COALESCE(?, is_active), status = COALESCE(?, status) WHERE id = ?',
      [is_active, status, id]
    );

    res.status(200).json({ success: true, message: 'Court settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateCourtRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    await db.query('UPDATE court_rates SET price = ? WHERE id = ?', [price, id]);

    res.status(200).json({ success: true, message: 'Court rate updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const adjustInventory = async (req, res) => {
  try {
    const managerId = req.user.id; 
    const { variant_id, quantity_change, movement_type, notes } = req.body; 
    // movement_type e.g. "Adjustment", "Damage", "Theft"

    await db.query(
      `INSERT INTO stock_movements (variant_id, quantity, movement_type, notes, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [variant_id, quantity_change, movement_type, notes, managerId]
    );

    // Update actual stock
    await db.query(
      'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [quantity_change, variant_id]
    );

    res.status(200).json({ success: true, message: 'Inventory adjusted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateBarMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, is_available } = req.body;

    await db.query(
      'UPDATE bar_menu_items SET price = COALESCE(?, price), is_available = COALESCE(?, is_available) WHERE id = ?',
      [price, is_available, id]
    );

    res.status(200).json({ success: true, message: 'Bar menu updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 2. Overrides & Corrections
// ============================================

const forceBookCourt = async (req, res) => {
  try {
    const { court_id, member_id, starts_at, ends_at, reservation_type, notes } = req.body;

    // 1. Force Create Reservation (bypasses any limits or clash checks)
    const [reservationResult] = await db.query(
      'INSERT INTO court_reservations (court_id, starts_at, ends_at, reservation_type, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [court_id, starts_at, ends_at, reservation_type, 'Confirmed', notes]
    );

    // 2. Create Booking
    const [bookingResult] = await db.query(
      'INSERT INTO bookings (reservation_id, member_id, status, created_at) VALUES (?, ?, ?, NOW())',
      [reservationResult.insertId, member_id, 'Confirmed']
    );

    res.status(201).json({ success: true, message: 'Court force-booked by Manager successfully', bookingId: bookingResult.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const voidInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.query('UPDATE invoices SET status = "Void", notes = CONCAT(COALESCE(notes, ""), " | Voided Reason: ", ?) WHERE id = ?', [reason, id]);

    res.status(200).json({ success: true, message: 'Invoice voided successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. Staff & Shift Management (HR)
// ============================================

const getEmployees = async (req, res) => {
  try {
    const [employees] = await db.query(`
      SELECT e.*, u.full_name, u.email, u.phone 
      FROM employees e 
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'Active'
    `);
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createShift = async (req, res) => {
  try {
    const { employee_id, start_time, end_time, role, notes } = req.body;

    const [shift] = await db.query(
      'INSERT INTO shifts (employee_id, start_time, end_time, role, notes, status, created_at) VALUES (?, ?, ?, ?, ?, "Scheduled", NOW())',
      [employee_id, start_time, end_time, role, notes]
    );

    res.status(201).json({ success: true, message: 'Shift created successfully', shiftId: shift.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, manager_notes } = req.body; // status: "Approved" or "Rejected"
    const managerId = req.user.id; 

    await db.query(
      'UPDATE leave_requests SET status = ?, manager_notes = ?, reviewed_by = ?, updated_at = NOW() WHERE id = ?',
      [status, manager_notes, managerId, id]
    );

    res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. Financial Reporting & End-of-Day
// ============================================

const closeRegister = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { closing_date, cash_expected, cash_actual, card_total, notes } = req.body;
    
    const discrepancy = cash_actual - cash_expected;

    const [closing] = await db.query(
      `INSERT INTO daily_closings (closing_date, closed_by, cash_expected, cash_actual, discrepancy, card_total, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [closing_date, managerId, cash_expected, cash_actual, discrepancy, card_total, notes]
    );

    res.status(201).json({ success: true, message: 'Register closed for the day', closingId: closing.insertId, discrepancy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getDailySummary = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Fetch payments grouped by source (payment method)
    const [payments] = await db.query(
      `SELECT payment_method, SUM(amount) as total 
       FROM payments 
       WHERE DATE(payment_date) = ? AND status = 'Successful' 
       GROUP BY payment_method`,
      [date]
    );

    // Fetch revenue split by Invoice type (if your invoices have a 'type' or by joining items)
    // Assuming simple aggregation for demonstration:
    const [revenueSplit] = await db.query(
      `SELECT status, SUM(total_amount) as total 
       FROM invoices 
       WHERE DATE(issue_date) = ? 
       GROUP BY status`,
      [date]
    );

    res.status(200).json({ 
      success: true, 
      date,
      total_payments: payments,
      invoice_summary: revenueSplit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  updateCourt,
  updateCourtRate,
  adjustInventory,
  updateBarMenu,
  forceBookCourt,
  voidInvoice,
  getEmployees,
  createShift,
  approveLeave,
  closeRegister,
  getDailySummary
};
