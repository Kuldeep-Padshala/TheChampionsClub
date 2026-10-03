const db = require('../config/db');

// ============================================
// 2. MEMBER MANAGEMENT
// ============================================

const getMembers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, member_code, full_name, phone, email, status FROM members';
    const params = [];

    if (search) {
      query += ' WHERE full_name LIKE ? OR phone LIKE ? OR member_code LIKE ?';
      const searchStr = `%${search}%`;
      params.push(searchStr, searchStr, searchStr);
    }
    const [members] = await db.query(query, params);
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const registerMember = async (req, res) => {
  try {
    const { full_name, email, phone, date_of_birth, address_line1 } = req.body;
    const member_code = 'MEM-' + Date.now(); // Generate a simple member code
    
    const [result] = await db.query(
      'INSERT INTO members (member_code, full_name, email, phone, date_of_birth, address_line1, status, joined_on, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW())',
      [member_code, full_name, email, phone, date_of_birth, address_line1, 'Active']
    );

    res.status(201).json({ success: true, message: 'Member registered successfully', memberId: result.insertId, member_code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch profile
    const [members] = await db.query('SELECT * FROM members WHERE id = ?', [id]);
    if (members.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });
    
    // Fetch active memberships
    const [memberships] = await db.query('SELECT m.*, p.name as plan_name FROM memberships m JOIN membership_plans p ON m.plan_id = p.id WHERE m.member_id = ? AND m.status = "Active"', [id]);
    
    // Fetch past bookings history
    const [bookings] = await db.query('SELECT * FROM bookings WHERE member_id = ? ORDER BY created_at DESC LIMIT 10', [id]);

    res.status(200).json({ success: true, profile: members[0], active_memberships: memberships, history: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const sellMembership = async (req, res) => {
  try {
    const { member_id, plan_id, start_date, end_date, fee_charged, joining_fee_charged } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, fee_charged, joining_fee_charged, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [member_id, plan_id, start_date, end_date, 'Active', fee_charged, joining_fee_charged]
    );

    res.status(201).json({ success: true, message: 'Membership started successfully', membershipId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. COURT CALENDAR & BOOKINGS
// ============================================

const getCourtAvailability = async (req, res) => {
  try {
    const { date, sport_id } = req.query; // date in YYYY-MM-DD
    
    let courtQuery = 'SELECT id, name FROM courts WHERE status = "Available"';
    const courtParams = [];
    if (sport_id) {
      courtQuery += ' AND sport_id = ?';
      courtParams.push(sport_id);
    }
    const [courts] = await db.query(courtQuery, courtParams);

    // Get bookings for that date
    const [reservations] = await db.query(
      `SELECT r.id, r.court_id, r.starts_at, r.ends_at, r.status 
       FROM court_reservations r 
       WHERE DATE(r.starts_at) = ? AND r.status != 'Cancelled'`,
      [date || new Date().toISOString().split('T')[0]]
    );

    res.status(200).json({ success: true, courts, reservations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { court_id, member_id, guest_id, starts_at, ends_at, reservation_type, amount_charged } = req.body;
    
    const [reservationResult] = await db.query(
      'INSERT INTO court_reservations (court_id, starts_at, ends_at, reservation_type, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [court_id, starts_at, ends_at, reservation_type, 'Confirmed']
    );

    const [bookingResult] = await db.query(
      'INSERT INTO bookings (reservation_id, member_id, guest_id, status, amount_charged, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [reservationResult.insertId, member_id || null, guest_id || null, 'Confirmed', amount_charged || 0]
    );

    res.status(201).json({ success: true, message: 'Booking created', bookingId: bookingResult.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    await db.query('UPDATE bookings SET status = "Cancelled", cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?', [cancellation_reason, id]);
    
    // We also need to get the reservation_id and cancel it
    const [booking] = await db.query('SELECT reservation_id FROM bookings WHERE id = ?', [id]);
    if (booking.length > 0) {
      await db.query('UPDATE court_reservations SET status = "Cancelled" WHERE id = ?', [booking[0].reservation_id]);
    }

    res.status(200).json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. CHECK-INS
// ============================================

const checkIn = async (req, res) => {
  try {
    const { member_id, booking_id, method } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO check_ins (member_id, booking_id, method, checked_in_at) VALUES (?, ?, ?, NOW())',
      [member_id, booking_id, method || 'Manual']
    );

    // If there is a booking, mark it checked-in
    if (booking_id) {
        await db.query('UPDATE bookings SET status = "Checked-in", checked_in_at = NOW() WHERE id = ?', [booking_id]);
    }

    res.status(201).json({ success: true, message: 'Check-in successful', checkInId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 5. BILLING & PAYMENTS
// ============================================

const getInvoices = async (req, res) => {
  try {
    // Get pending/unpaid invoices
    const [invoices] = await db.query('SELECT id, invoice_no, bill_to_name, total_amount, balance_due, due_date, status FROM invoices WHERE status != "Paid"');
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { member_id, guest_id, bill_to_name, subtotal, tax_total, total_amount, due_date } = req.body;
    const invoice_no = 'INV-' + Date.now();

    const [result] = await db.query(
      'INSERT INTO invoices (invoice_no, member_id, guest_id, bill_to_name, status, issue_date, due_date, subtotal, tax_total, total_amount, balance_due, created_at) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, NOW())',
      [invoice_no, member_id || null, guest_id || null, bill_to_name, 'Pending', due_date, subtotal, tax_total, total_amount, total_amount]
    );

    res.status(201).json({ success: true, message: 'Invoice generated', invoiceId: result.insertId, invoice_no });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { invoice_id, amount, method, transaction_ref } = req.body;
    const receipt_no = 'REC-' + Date.now();

    // Insert payment
    const [result] = await db.query(
      'INSERT INTO payments (receipt_no, invoice_id, amount, method, status, transaction_ref, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [receipt_no, invoice_id, amount, method, 'Completed', transaction_ref || null]
    );

    // Update invoice balance
    await db.query(
      'UPDATE invoices SET amount_paid = COALESCE(amount_paid, 0) + ?, balance_due = balance_due - ? WHERE id = ?',
      [amount, amount, invoice_id]
    );

    // Check if fully paid
    const [invoice] = await db.query('SELECT balance_due FROM invoices WHERE id = ?', [invoice_id]);
    if (invoice[0].balance_due <= 0) {
      await db.query('UPDATE invoices SET status = "Paid" WHERE id = ?', [invoice_id]);
    }

    res.status(201).json({ success: true, message: 'Payment recorded', paymentId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 6. ENQUIRIES & LEADS
// ============================================

const getEnquiries = async (req, res) => {
  try {
    const [enquiries] = await db.query('SELECT id, full_name, phone, email, source, enquiry_type, status, next_follow_up_at FROM enquiries ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createEnquiry = async (req, res) => {
  try {
    const { full_name, phone, email, source, enquiry_type, message } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO enquiries (full_name, phone, email, source, enquiry_type, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [full_name, phone, email, source, enquiry_type, message, 'Open']
    );

    res.status(201).json({ success: true, message: 'Enquiry logged', enquiryId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note_summary } = req.body;

    // Update status
    if (status) {
      await db.query('UPDATE enquiries SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    }

    // Add note to enquiry_activities
    if (note_summary) {
      await db.query(
        'INSERT INTO enquiry_activities (enquiry_id, activity_type, summary, occurred_at) VALUES (?, ?, ?, NOW())',
        [id, 'Note Added', note_summary]
      );
    }

    res.status(200).json({ success: true, message: 'Enquiry updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  // Member Management
  getMembers,
  registerMember,
  getMemberById,
  sellMembership,
  
  // Courts & Bookings
  getCourtAvailability,
  createBooking,
  cancelBooking,

  // Check-ins
  checkIn,

  // Billing
  getInvoices,
  createInvoice,
  recordPayment,

  // Enquiries
  getEnquiries,
  createEnquiry,
  updateEnquiry
};
