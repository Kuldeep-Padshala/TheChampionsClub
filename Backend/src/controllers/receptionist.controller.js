const { pool } = require('../config/db');

// ============================================
// 1. MEMBER MANAGEMENT
// ============================================

async function getMembers(req, res) {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        m.id, 
        m.member_code, 
        m.qr_token,
        m.full_name, 
        m.phone, 
        m.email, 
        m.status, 
        m.joined_on,
        (
          SELECT p.name 
          FROM memberships ms 
          JOIN membership_plans p ON ms.plan_id = p.id 
          WHERE ms.member_id = m.id AND ms.status = 'active' 
          ORDER BY ms.end_date DESC LIMIT 1
        ) as current_plan,
        (
          SELECT ms.end_date 
          FROM memberships ms 
          WHERE ms.member_id = m.id AND ms.status = 'active' 
          ORDER BY ms.end_date DESC LIMIT 1
        ) as plan_expiry,
        (
          SELECT COALESCE(SUM(i.balance_due), 0) 
          FROM invoices i 
          WHERE i.member_id = m.id AND (i.balance_due > 0 OR i.status != 'paid')
        ) as total_dues
      FROM members m
    `;
    const params = [];

    if (search) {
      query += ` WHERE m.full_name LIKE ? OR m.phone LIKE ? OR m.member_code LIKE ? OR m.email LIKE ? OR m.qr_token = ?`;
      const s = `%${search}%`;
      params.push(s, s, s, s, String(search).trim());
    }

    query += ` ORDER BY m.id DESC LIMIT 100`;

    const [members] = await pool.query(query, params);
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('[getMembers]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
}

async function registerMember(req, res) {
  try {
    const { full_name, email, phone, date_of_birth, address_line1, plan_id } = req.body;
    if (!full_name || !phone) {
      res.status(400).json({ success: false, message: 'Name and phone are required' });
      return;
    }

    const member_code = 'CC-2026-' + Math.floor(1000 + Math.random() * 9000);
    const qr_token = 'QR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const finalDob = date_of_birth || '1995-01-01';
    const staffId = req.user?.id ? Number(req.user.id) : null;

    const [result] = await pool.query(
      `INSERT INTO members (member_code, qr_token, full_name, email, phone, date_of_birth, address_line1, status, joined_on, registered_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURDATE(), ?, NOW(), NOW())`,
      [member_code, qr_token, full_name, email || null, phone, finalDob, address_line1 || null, staffId]
    );

    const newMemberId = result.insertId;

    // If an initial membership plan is selected, assign it
    if (plan_id) {
      const [planRows] = await pool.query('SELECT * FROM membership_plans WHERE id = ?', [plan_id]);
      if (planRows.length > 0) {
        const plan = planRows[0];
        const durationMonths = plan.duration_months || 12;
        const fee = Number(plan.fee || 0);
        const joiningFee = Number(plan.joining_fee || 0);
        const total = fee + joiningFee;

        // Insert membership
        await pool.query(
          `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, started_as, fee_charged, joining_fee_charged, created_by, created_at, updated_at)
           VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? MONTH), 'active', 'new', ?, ?, ?, NOW(), NOW())`,
          [newMemberId, plan_id, durationMonths, fee, joiningFee, staffId]
        );

        // Generate initial invoice
        const invoice_no = 'INV-' + Date.now();
        await pool.query(
          `INSERT INTO invoices (invoice_no, member_id, bill_to_name, status, issue_date, due_date, subtotal, tax_total, total_amount, balance_due, issued_by, created_at, updated_at)
           VALUES (?, ?, ?, 'issued', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), ?, 0, ?, ?, ?, NOW(), NOW())`,
          [invoice_no, newMemberId, full_name, total, total, total, staffId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      memberId: newMemberId,
      member_code,
      qr_token,
    });
  } catch (error) {
    console.error('[registerMember]', error);
    res.status(500).json({ success: false, message: 'Failed to register member' });
  }
}

async function getMemberById(req, res) {
  try {
    const { id } = req.params;

    const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);
    if (members.length === 0) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    // Active memberships with plan details
    const [memberships] = await pool.query(
      `SELECT m.*, p.name as plan_name, p.fee as plan_fee, p.code as plan_code 
       FROM memberships m 
       JOIN membership_plans p ON m.plan_id = p.id 
       WHERE m.member_id = ? 
       ORDER BY m.end_date DESC`,
      [id]
    );

    // Past bookings
    const [bookings] = await pool.query(
      `SELECT b.*, c.name as court_name, r.starts_at, r.ends_at, r.reservation_type 
       FROM bookings b 
       JOIN court_reservations r ON b.reservation_id = r.id 
       JOIN courts c ON r.court_id = c.id 
       WHERE b.member_id = ? 
       ORDER BY r.starts_at DESC LIMIT 15`,
      [id]
    );

    // Check-in history
    const [checkIns] = await pool.query(
      `SELECT id, method, checked_in_at, notes 
       FROM check_ins 
       WHERE member_id = ? 
       ORDER BY checked_in_at DESC LIMIT 15`,
      [id]
    );

    // Unpaid invoices
    const [invoices] = await pool.query(
      `SELECT id, invoice_no, total_amount, balance_due, due_date, status, issue_date 
       FROM invoices 
       WHERE member_id = ? AND (balance_due > 0 OR status != 'paid') 
       ORDER BY due_date ASC`,
      [id]
    );

    res.json({
      success: true,
      profile: members[0],
      active_memberships: memberships,
      bookings,
      checkIns,
      unpaid_invoices: invoices,
    });
  } catch (error) {
    console.error('[getMemberById]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch member details' });
  }
}

async function sellMembership(req, res) {
  try {
    const { member_id, plan_id, start_date, end_date, fee_charged, joining_fee_charged } = req.body;
    if (!member_id || !plan_id) {
      res.status(400).json({ success: false, message: 'Member ID and Plan ID are required' });
      return;
    }

    const [planRows] = await pool.query('SELECT * FROM membership_plans WHERE id = ?', [plan_id]);
    if (planRows.length === 0) {
      res.status(404).json({ success: false, message: 'Plan not found' });
      return;
    }
    const plan = planRows[0];
    const duration = plan.duration_months || 12;
    const finalStartDate = start_date || new Date().toISOString().split('T')[0];
    const fee = Number(fee_charged ?? plan.fee);
    const joiningFee = Number(joining_fee_charged ?? plan.joining_fee ?? 0);
    const total = fee + joiningFee;
    const staffId = req.user?.id ? Number(req.user.id) : null;

    const [membershipResult] = await pool.query(
      `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, started_as, fee_charged, joining_fee_charged, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, COALESCE(?, DATE_ADD(?, INTERVAL ? MONTH)), 'active', 'renewal', ?, ?, ?, NOW(), NOW())`,
      [member_id, plan_id, finalStartDate, end_date || null, finalStartDate, duration, fee, joiningFee, staffId]
    );

    // Get member name for invoice
    const [memberRows] = await pool.query('SELECT full_name FROM members WHERE id = ?', [member_id]);
    const billTo = memberRows[0]?.full_name || 'Member';

    // Auto-generate invoice
    const invoice_no = 'INV-' + Date.now();
    const [invResult] = await pool.query(
      `INSERT INTO invoices (invoice_no, member_id, bill_to_name, status, issue_date, due_date, subtotal, tax_total, total_amount, balance_due, issued_by, created_at, updated_at) 
       VALUES (?, ?, ?, 'issued', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), ?, 0, ?, ?, ?, NOW(), NOW())`,
      [invoice_no, member_id, billTo, total, total, total, staffId]
    );

    res.status(201).json({
      success: true,
      message: 'Membership assigned and invoice generated successfully',
      membershipId: membershipResult.insertId,
      invoiceId: invResult.insertId,
      invoice_no,
    });
  } catch (error) {
    console.error('[sellMembership]', error);
    res.status(500).json({ success: false, message: 'Failed to assign membership' });
  }
}

// ============================================
// 2. CHECK-IN SYSTEM (HIGH PRIORITY)
// ============================================

async function checkIn(req, res) {
  try {
    const { member_id, code, booking_id, method } = req.body;
    let targetMemberId = member_id;

    // If QR code / barcode / text code was scanned or entered:
    if (!targetMemberId && code) {
      const cleanCode = String(code).trim();
      const [rows] = await pool.query(
        `SELECT id FROM members WHERE qr_token = ? OR member_code = ? OR phone = ? OR id = ? LIMIT 1`,
        [cleanCode, cleanCode, cleanCode, cleanCode]
      );
      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'No member found matching scanned code / QR / phone' });
        return;
      }
      targetMemberId = rows[0].id;
    }

    if (!targetMemberId) {
      res.status(400).json({ success: false, message: 'Member ID or scanned code is required' });
      return;
    }

    // 1. Fetch Member
    const [memberRows] = await pool.query(
      'SELECT id, member_code, qr_token, full_name, phone, email, status FROM members WHERE id = ?',
      [targetMemberId]
    );
    if (memberRows.length === 0) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }
    const member = memberRows[0];

    // 2. Check Active Membership
    const [membershipRows] = await pool.query(
      `SELECT m.*, p.name as plan_name 
       FROM memberships m 
       JOIN membership_plans p ON m.plan_id = p.id 
       WHERE m.member_id = ? 
       ORDER BY m.end_date DESC LIMIT 1`,
      [targetMemberId]
    );

    let isMembershipExpired = false;
    let hasNoPlan = false;
    let planName = 'No Active Plan';
    let planExpiry = null;

    if (membershipRows.length === 0) {
      hasNoPlan = true;
    } else {
      const latest = membershipRows[0];
      planName = latest.plan_name;
      planExpiry = latest.end_date;
      const now = new Date();
      if (new Date(latest.end_date) < now || latest.status !== 'active') {
        isMembershipExpired = true;
      }
    }

    // 3. Check Unpaid Invoices
    const [unpaidInvoices] = await pool.query(
      `SELECT id, invoice_no, total_amount, balance_due, due_date 
       FROM invoices 
       WHERE member_id = ? AND (balance_due > 0 OR status NOT IN ('paid', 'Paid'))`,
      [targetMemberId]
    );

    const totalUnpaid = unpaidInvoices.reduce((acc, inv) => acc + Number(inv.balance_due || 0), 0);
    const hasUnpaidBills = totalUnpaid > 0;

    // Normalize method for check_ins_chk_1 constraint: ('qr', 'member_code', 'name_search', 'phone')
    let dbMethod = 'member_code';
    const m = String(method || '').toLowerCase();
    if (m.includes('qr')) {
      dbMethod = 'qr';
    } else if (m.includes('phone')) {
      dbMethod = 'phone';
    } else if (m.includes('search') || m.includes('manual')) {
      dbMethod = 'name_search';
    } else {
      dbMethod = 'member_code';
    }

    // 4. Record Check-In
    const [result] = await pool.query(
      `INSERT INTO check_ins (member_id, booking_id, method, recorded_by, checked_in_at) VALUES (?, ?, ?, ?, NOW())`,
      [targetMemberId, booking_id || null, dbMethod, req.user?.id || null]
    );

    // If there is an active booking, mark it checked-in
    if (booking_id) {
      await pool.query(
        `UPDATE bookings SET status = 'checked_in', checked_in_at = NOW() WHERE id = ?`,
        [booking_id]
      );
    }

    // Determine status alert
    const hasAlert = isMembershipExpired || hasNoPlan || hasUnpaidBills || member.status !== 'active';

    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully',
      checkInId: result.insertId,
      checked_in_at: new Date().toISOString(),
      member: {
        id: member.id,
        member_code: member.member_code,
        full_name: member.full_name,
        phone: member.phone,
        email: member.email,
        status: member.status,
      },
      membership: {
        planName,
        planExpiry,
        isExpired: isMembershipExpired,
        hasNoPlan,
        status: isMembershipExpired ? 'Expired' : hasNoPlan ? 'None' : 'Active',
      },
      billing: {
        hasUnpaidBills,
        totalUnpaid,
        unpaidInvoices,
      },
      alert: hasAlert
        ? {
            level: (isMembershipExpired || member.status !== 'active') ? 'CRITICAL' : 'WARNING',
            message: isMembershipExpired
              ? `Membership has expired on ${new Date(planExpiry).toLocaleDateString()}`
              : hasUnpaidBills
              ? `Outstanding dues: ₹${totalUnpaid.toLocaleString('en-IN')}`
              : member.status !== 'active'
              ? `Member status is currently ${member.status}`
              : 'No active membership plan registered',
          }
        : null,
    });
  } catch (error) {
    console.error('[checkIn]', error);
    res.status(500).json({ success: false, message: 'Failed to record check-in' });
  }
}

// ============================================
// 3. COURT CALENDAR & BOOKINGS
// ============================================

async function getCourtAvailability(req, res) {
  try {
    const { date, sport_id } = req.query;
    const queryDate = date ? String(date) : new Date().toISOString().split('T')[0];

    let courtQuery = `
      SELECT c.id, c.name, c.sport_id, c.surface, c.is_indoor, c.status, s.name as sport_name 
      FROM courts c 
      LEFT JOIN sports s ON c.sport_id = s.id 
      WHERE c.status IN ('active', 'Available')
    `;
    const courtParams = [];
    if (sport_id) {
      courtQuery += ' AND c.sport_id = ?';
      courtParams.push(sport_id);
    }
    courtQuery += ' ORDER BY c.sport_id ASC, c.id ASC';

    const [courts] = await pool.query(courtQuery, courtParams);

    // Fetch reservations on that date
    const [reservations] = await pool.query(
      `SELECT 
        r.id as reservation_id, 
        r.court_id, 
        r.starts_at, 
        r.ends_at, 
        r.reservation_type, 
        r.status as reservation_status,
        b.id as booking_id,
        b.booking_ref,
        b.status as booking_status,
        b.amount_charged,
        b.notes,
        m.id as member_id,
        m.full_name as member_name,
        m.phone as member_phone,
        m.member_code
       FROM court_reservations r 
       LEFT JOIN bookings b ON b.reservation_id = r.id AND b.status != 'Cancelled'
       LEFT JOIN members m ON b.member_id = m.id
       WHERE DATE(r.starts_at) = ? AND r.status != 'Cancelled'`,
      [queryDate]
    );

    res.json({ success: true, date: queryDate, courts, reservations });
  } catch (error) {
    console.error('[getCourtAvailability]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch court schedule' });
  }
}

async function createBooking(req, res) {
  try {
    const {
      court_id,
      member_id,
      guest_name,
      guest_phone,
      starts_at,
      ends_at,
      reservation_type,
      amount_charged,
      notes,
    } = req.body;

    if (!court_id || !starts_at || !ends_at) {
      res.status(400).json({ success: false, message: 'Court, start time, and end time are required' });
      return;
    }

    // Check conflict
    const [conflicts] = await pool.query(
      `SELECT id FROM court_reservations 
       WHERE court_id = ? AND status = 'active'
       AND ((starts_at < ? AND ends_at > ?) OR (starts_at < ? AND ends_at > ?))`,
      [court_id, ends_at, starts_at, starts_at, ends_at]
    );

    if (conflicts.length > 0) {
      res.status(409).json({ success: false, message: 'This court is already reserved for the selected time slot' });
      return;
    }

    const resType = reservation_type === 'social' ? 'social' : 'exclusive';
    const socialCapacity = resType === 'social' ? 8 : null;

    // Insert reservation
    const [resResult] = await pool.query(
      `INSERT INTO court_reservations (court_id, starts_at, ends_at, reservation_type, status, social_capacity, created_by, created_at) 
       VALUES (?, ?, ?, ?, 'active', ?, ?, NOW())`,
      [court_id, starts_at, ends_at, resType, socialCapacity, req.user?.id || null]
    );

    const bookingRef = 'BKNG-' + Date.now();
    
    // Manage walk-in guest vs member constraint: ((member_id is not null) + (guest_id is not null)) = 1
    let guestId = null;
    const finalMemberId = member_id ? Number(member_id) : null;
    if (!finalMemberId) {
      const [guestResult] = await pool.query(
        `INSERT INTO guests (full_name, phone, source, notes, created_at) VALUES (?, ?, 'walk_in', ?, NOW())`,
        [guest_name || 'Walk-in Guest', guest_phone || null, notes || null]
      );
      guestId = guestResult.insertId;
    }

    const combinedNotes = notes || (guest_name ? `Walk-in Guest: ${guest_name}` : null);
    const bookedVia = finalMemberId ? 'front_desk' : 'walk_in';
    const priceBasis = finalMemberId ? 'member_rate' : 'walk_in_rate';

    // Insert booking
    const [bookResult] = await pool.query(
      `INSERT INTO bookings (booking_ref, reservation_id, reservation_type, member_id, guest_id, booked_via, price_basis, status, amount_charged, notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, NOW(), NOW())`,
      [bookingRef, resResult.insertId, resType, finalMemberId, guestId, bookedVia, priceBasis, Number(amount_charged) || 0, combinedNotes]
    );

    res.status(201).json({
      success: true,
      message: 'Court booked successfully',
      bookingId: bookResult.insertId,
      bookingRef,
      reservationId: resResult.insertId,
    });
  } catch (error) {
    console.error('[createBooking]', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
}

async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const [bookings] = await pool.query('SELECT reservation_id FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?`,
      [cancellation_reason || 'Cancelled by Front Desk', id]
    );

    if (bookings[0].reservation_id) {
      await pool.query(
        `UPDATE court_reservations SET status = 'cancelled' WHERE id = ?`,
        [bookings[0].reservation_id]
      );
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('[cancelBooking]', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
}

// ============================================
// 4. BILLING & PAYMENTS (POS)
// ============================================

async function getInvoices(req, res) {
  try {
    const [invoices] = await pool.query(
      `SELECT 
        i.id, 
        i.invoice_no, 
        i.member_id, 
        i.bill_to_name, 
        i.total_amount, 
        i.amount_paid,
        i.balance_due, 
        i.due_date, 
        i.issue_date, 
        i.status,
        m.phone as member_phone,
        m.member_code
       FROM invoices i 
       LEFT JOIN members m ON i.member_id = m.id 
       WHERE i.balance_due > 0 OR i.status NOT IN ('paid', 'Paid')
       ORDER BY i.due_date ASC`
    );

    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('[getInvoices]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
}

async function createInvoice(req, res) {
  try {
    const { member_id, bill_to_name, subtotal, tax_total, total_amount, due_date, notes } = req.body;
    const invoice_no = 'INV-' + Date.now();
    const finalTotal = total_amount || subtotal || 0;

    const [result] = await pool.query(
      `INSERT INTO invoices (invoice_no, member_id, bill_to_name, status, issue_date, due_date, subtotal, tax_total, total_amount, balance_due, notes, created_at, updated_at) 
       VALUES (?, ?, ?, 'issued', CURDATE(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [invoice_no, member_id || null, bill_to_name, due_date || null, subtotal || finalTotal, tax_total || 0, finalTotal, finalTotal, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoiceId: result.insertId,
      invoice_no,
    });
  } catch (error) {
    console.error('[createInvoice]', error);
    res.status(500).json({ success: false, message: 'Failed to create invoice' });
  }
}

async function recordPayment(req, res) {
  try {
    const { invoice_id, amount, method, transaction_ref, notes } = req.body;
    if (!invoice_id || !amount) {
      res.status(400).json({ success: false, message: 'Invoice ID and payment amount are required' });
      return;
    }

    const payAmount = Number(amount);
    const receipt_no = 'REC-' + Date.now();

    // payments_chk_2: method in ('cash', 'card', 'upi', 'online', 'bank_transfer', 'cheque')
    let dbMethod = 'cash';
    const m = String(method || '').toLowerCase();
    if (m === 'card') dbMethod = 'card';
    else if (m === 'upi') dbMethod = 'upi';
    else if (m === 'online') dbMethod = 'online';
    else if (m.includes('transfer')) dbMethod = 'bank_transfer';
    else if (m.includes('cheque') || m.includes('check')) dbMethod = 'cheque';
    else dbMethod = 'cash';

    // 1. Insert Payment (payments_chk_3: status in ('pending', 'success', 'failed'))
    const [result] = await pool.query(
      `INSERT INTO payments (receipt_no, invoice_id, amount, method, status, transaction_ref, notes, received_by, paid_at, created_at) 
       VALUES (?, ?, ?, ?, 'success', ?, ?, ?, NOW(), NOW())`,
      [receipt_no, invoice_id, payAmount, dbMethod, transaction_ref || null, notes || null, req.user?.id || null]
    );

    // 2. Update Invoice balance
    await pool.query(
      `UPDATE invoices 
       SET amount_paid = COALESCE(amount_paid, 0) + ?, balance_due = balance_due - ? 
       WHERE id = ?`,
      [payAmount, payAmount, invoice_id]
    );

    // 3. Mark paid if balance <= 0
    const [invoiceRows] = await pool.query('SELECT balance_due, invoice_no, bill_to_name FROM invoices WHERE id = ?', [invoice_id]);
    if (invoiceRows.length > 0 && Number(invoiceRows[0].balance_due) <= 0) {
      await pool.query(`UPDATE invoices SET status = 'paid', balance_due = 0 WHERE id = ?`, [invoice_id]);
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: result.insertId,
      receipt_no,
      invoice_no: invoiceRows[0]?.invoice_no,
      bill_to_name: invoiceRows[0]?.bill_to_name,
      amount: payAmount,
      method: method || 'Cash',
      date: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[recordPayment]', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
}

// ============================================
// 5. ENQUIRIES & LEAD MANAGEMENT
// ============================================

async function getEnquiries(req, res) {
  try {
    const [enquiries] = await pool.query(
      `SELECT 
        e.id, 
        e.full_name, 
        e.phone, 
        e.email, 
        e.source, 
        e.enquiry_type, 
        e.message, 
        e.status, 
        e.next_follow_up_at, 
        e.created_at,
        p.name as interested_plan,
        s.name as interested_sport,
        a.summary as latest_note
       FROM enquiries e 
       LEFT JOIN membership_plans p ON e.interested_plan_id = p.id 
       LEFT JOIN sports s ON e.interested_sport_id = s.id 
       LEFT JOIN enquiry_activities a ON a.id = (
         SELECT id FROM enquiry_activities WHERE enquiry_id = e.id ORDER BY occurred_at DESC LIMIT 1
       )
       ORDER BY e.created_at DESC`
    );

    res.json({ success: true, data: enquiries });
  } catch (error) {
    console.error('[getEnquiries]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
  }
}

async function createEnquiry(req, res) {
  try {
    const { full_name, phone, email, source, enquiry_type, message, interested_plan_id, interested_sport_id } = req.body;
    if (!full_name || !phone) {
      res.status(400).json({ success: false, message: 'Name and phone are required for enquiries' });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO enquiries (full_name, phone, email, source, enquiry_type, message, interested_plan_id, interested_sport_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open', NOW(), NOW())`,
      [full_name, phone, email || null, source || 'Walk-in', enquiry_type || 'Membership', message || null, interested_plan_id || null, interested_sport_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Enquiry logged successfully',
      enquiryId: result.insertId,
    });
  } catch (error) {
    console.error('[createEnquiry]', error);
    res.status(500).json({ success: false, message: 'Failed to create enquiry' });
  }
}

async function updateEnquiry(req, res) {
  try {
    const { id } = req.params;
    const { status, note_summary, next_follow_up_at } = req.body;

    if (status || next_follow_up_at) {
      let q = 'UPDATE enquiries SET updated_at = NOW()';
      const p = [];
      if (status) {
        q += ', status = ?';
        p.push(status);
        if (status === 'Closed' || status === 'Joined') {
          q += ', closed_at = NOW()';
        }
      }
      if (next_follow_up_at) {
        q += ', next_follow_up_at = ?';
        p.push(next_follow_up_at);
      }
      q += ' WHERE id = ?';
      p.push(id);
      await pool.query(q, p);
    }

    if (note_summary) {
      await pool.query(
        `INSERT INTO enquiry_activities (enquiry_id, activity_type, summary, performed_by, occurred_at) 
         VALUES (?, 'note', ?, ?, NOW())`,
        [id, note_summary, req.user?.id || null]
      );
    }

    res.json({ success: true, message: 'Enquiry updated successfully' });
  } catch (error) {
    console.error('[updateEnquiry]', error);
    res.status(500).json({ success: false, message: 'Failed to update enquiry' });
  }
}

// ============================================
// 6. HELPER DROPDOWNS
// ============================================

async function getSports(_req, res) {
  try {
    const [sports] = await pool.query('SELECT id, name FROM sports WHERE is_active = 1');
    res.json({ success: true, data: sports });
  } catch (error) {
    console.error('[getSports]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sports' });
  }
}

async function getMembershipPlans(_req, res) {
  try {
    const [plans] = await pool.query(
      'SELECT id, code, name, fee, duration_months, joining_fee, description FROM membership_plans WHERE is_active = 1 ORDER BY fee ASC'
    );
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('[getMembershipPlans]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch membership plans' });
  }
}

module.exports = {
  getMembers,
  registerMember,
  getMemberById,
  sellMembership,
  checkIn,
  getCourtAvailability,
  createBooking,
  cancelBooking,
  getInvoices,
  createInvoice,
  recordPayment,
  getEnquiries,
  createEnquiry,
  updateEnquiry,
  getSports,
  getMembershipPlans,
};
