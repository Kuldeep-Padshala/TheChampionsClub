const { pool } = require('../config/db');
const { createAndSendNotification, broadcast, sendToRole } = require('../services/websocket.service');

// Helper to get or create member record for a user
async function getOrCreateMember(userId, userEmail, userName) {
  let [members] = await pool.query('SELECT * FROM members WHERE user_id = ? LIMIT 1', [userId]);
  if (members.length > 0) return members[0];

  // Try finding by email
  if (userEmail) {
    [members] = await pool.query('SELECT * FROM members WHERE email = ? LIMIT 1', [userEmail]);
    if (members.length > 0) {
      await pool.query('UPDATE members SET user_id = ? WHERE id = ?', [userId, members[0].id]);
      members[0].user_id = userId;
      return members[0];
    }
  }

  // Check if user has a pending or rejected membership application
  const [reqs] = await pool.query(
    'SELECT * FROM membership_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1',
    [userId]
  );
  if (reqs.length > 0 && reqs[0].status !== 'approved') {
    // Waiting for admin acceptance or rejected; do NOT auto-create active member
    return null;
  }

  // Look up user's phone and name from users table if available
  let userPhone = null;
  try {
    const [uRows] = await pool.query('SELECT phone, full_name FROM users WHERE id = ? LIMIT 1', [userId]);
    if (uRows.length > 0) {
      userPhone = uRows[0].phone;
      if (!userName && uRows[0].full_name) userName = uRows[0].full_name;
    }
  } catch (err) {
    console.error('[getOrCreateMember] lookup user error:', err.message);
  }

  // Create new member record
  const memberCode = 'CC-2026-' + Math.floor(1000 + Math.random() * 9000);
  const qrToken = 'QR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  const phone = userPhone || ('+91-9' + Math.floor(100000000 + Math.random() * 900000000));
  const [result] = await pool.query(
    `INSERT INTO members (user_id, member_code, qr_token, full_name, phone, email, date_of_birth, status, joined_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, '1995-01-01', 'active', CURDATE(), NOW(), NOW())`,
    [userId, memberCode, qrToken, userName || 'Club Member', phone, userEmail || null]
  );

  const memberId = result.insertId;
  const [newMembers] = await pool.query('SELECT * FROM members WHERE id = ?', [memberId]);
  return newMembers[0];
}

// ============================================
// 1. MEMBER PROFILE & DIGITAL PASS
// ============================================

async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;

    const member = await getOrCreateMember(userId, userEmail, userName);

    if (!member) {
      // Check for pending application
      const [reqRows] = await pool.query(
        'SELECT * FROM membership_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
      );
      const latestReq = reqRows.length > 0 ? reqRows[0] : null;

      return res.json({
        success: true,
        profile: null,
        is_pending_approval: latestReq?.status === 'pending',
        is_rejected: latestReq?.status === 'rejected',
        membership_request: latestReq,
        active_membership: null,
        total_dues: 0,
        unpaid_invoices: [],
        recent_checkins: [],
      });
    }

    // Active membership plan details
    const [memberships] = await pool.query(
      `SELECT m.*, p.name as plan_name, p.code as plan_code, p.description as plan_description, p.fee as plan_fee 
       FROM memberships m 
       JOIN membership_plans p ON m.plan_id = p.id 
       WHERE m.member_id = ? AND m.status = 'active'
       ORDER BY m.end_date DESC LIMIT 1`,
      [member.id]
    );

    // Unpaid invoices
    const [invoices] = await pool.query(
      `SELECT id, invoice_no, total_amount, balance_due, due_date, status, issue_date 
       FROM invoices 
       WHERE member_id = ? AND (balance_due > 0 OR status NOT IN ('paid', 'Paid'))
       ORDER BY due_date ASC`,
      [member.id]
    );

    const totalDues = invoices.reduce((acc, inv) => acc + Number(inv.balance_due || 0), 0);

    // Recent check-in history
    const [checkIns] = await pool.query(
      `SELECT id, method, checked_in_at 
       FROM check_ins 
       WHERE member_id = ? 
       ORDER BY checked_in_at DESC LIMIT 5`,
      [member.id]
    );

    res.json({
      success: true,
      profile: member,
      active_membership: memberships[0] || null,
      total_dues: totalDues,
      unpaid_invoices: invoices,
      recent_checkins: checkIns,
    });
  } catch (error) {
    console.error('[getMe]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch member profile' });
  }
}

async function updateMe(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);

    const {
      phone,
      address_line1,
      address_line2,
      city,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    await pool.query(
      `UPDATE members 
       SET phone = COALESCE(?, phone), 
           address_line1 = COALESCE(?, address_line1), 
           address_line2 = COALESCE(?, address_line2), 
           city = COALESCE(?, city), 
           emergency_contact_name = COALESCE(?, emergency_contact_name), 
           emergency_contact_phone = COALESCE(?, emergency_contact_phone), 
           updated_at = NOW() 
       WHERE id = ?`,
      [
        phone || null,
        address_line1 || null,
        address_line2 || null,
        city || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        member.id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM members WHERE id = ?', [member.id]);
    res.json({ success: true, message: 'Profile updated successfully', profile: updated[0] });
  } catch (error) {
    console.error('[updateMe]', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

// ============================================
// 2. COURT BOOKINGS
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

    const [reservations] = await pool.query(
      `SELECT 
        r.id as reservation_id, 
        r.court_id, 
        DATE_FORMAT(r.starts_at, '%Y-%m-%d %H:%i:%s') as starts_at, 
        DATE_FORMAT(r.ends_at, '%Y-%m-%d %H:%i:%s') as ends_at, 
        r.reservation_type, 
        r.status as reservation_status,
        b.id as booking_id,
        b.booking_ref,
        b.status as booking_status,
        b.amount_charged,
        b.member_id
       FROM court_reservations r 
       LEFT JOIN bookings b ON b.reservation_id = r.id AND b.status != 'Cancelled'
       WHERE DATE(r.starts_at) = ? AND r.status != 'Cancelled'`,
      [queryDate]
    );

    res.json({ success: true, date: queryDate, courts, reservations });
  } catch (error) {
    console.error('[member getCourtAvailability]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch court schedule' });
  }
}

async function getMyBookings(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);

    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.booking_ref,
        b.status,
        b.amount_charged,
        b.price_basis,
        b.notes,
        b.created_at,
        DATE_FORMAT(r.starts_at, '%Y-%m-%d %H:%i:%s') as starts_at,
        DATE_FORMAT(r.ends_at, '%Y-%m-%d %H:%i:%s') as ends_at,
        r.reservation_type,
        c.id as court_id,
        c.name as court_name,
        c.surface,
        c.is_indoor,
        s.name as sport_name
       FROM bookings b
       JOIN court_reservations r ON b.reservation_id = r.id
       JOIN courts c ON r.court_id = c.id
       LEFT JOIN sports s ON c.sport_id = s.id
       WHERE b.member_id = ?
          OR b.member_id IN (SELECT id FROM members WHERE user_id = ?)
          OR b.member_id IN (SELECT id FROM members WHERE email = ?)
       ORDER BY r.starts_at DESC`,
      [member.id, userId, req.user.email || '']
    );

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('[getMyBookings]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
}

async function createMyBooking(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);
    const { court_id, starts_at, ends_at, reservation_type, notes } = req.body;

    if (!court_id || !starts_at || !ends_at) {
      res.status(400).json({ success: false, message: 'Court, start time, and end time are required' });
      return;
    }

    // 1. Check if member has active membership or has paid via Razorpay
    const [memberships] = await pool.query(
      `SELECT * FROM memberships WHERE member_id = ? AND status = 'active' AND end_date >= CURDATE() LIMIT 1`,
      [member.id]
    );

    const activePlan = memberships.length > 0 ? memberships[0] : null;

    // 2. Enforce max 2 bookings per day
    const bookingDate = starts_at.split('T')[0].split(' ')[0];
    const [dailyBookings] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM bookings b 
       JOIN court_reservations r ON b.reservation_id = r.id 
       WHERE b.member_id = ? AND DATE(r.starts_at) = ? AND b.status != 'cancelled'`,
      [member.id, bookingDate]
    );

    if (dailyBookings[0].count >= 2) {
      res.status(429).json({ success: false, message: 'Daily limit reached: Maximum of 2 court bookings allowed per day.' });
      return;
    }

    // 3. Check Court Conflict (accurate overlap condition: starts_at < new_ends AND ends_at > new_starts)
    const [conflicts] = await pool.query(
      `SELECT id FROM court_reservations 
       WHERE court_id = ? AND status = 'active'
         AND starts_at < ? AND ends_at > ?`,
      [court_id, ends_at, starts_at]
    );

    if (conflicts.length > 0) {
      res.status(409).json({ success: false, message: 'This court is already reserved for the chosen time slot.' });
      return;
    }

    // 4. Calculate Rate (from court_rates or request)
    let amountCharged = 0;
    if (req.body.amount_charged !== undefined) {
      amountCharged = Number(req.body.amount_charged);
    } else if (activePlan) {
      const [rates] = await pool.query(
        `SELECT price FROM court_rates 
         WHERE sport_id = (SELECT sport_id FROM courts WHERE id = ?) 
           AND plan_id = ? 
         ORDER BY id ASC LIMIT 1`,
        [court_id, activePlan.plan_id]
      );
      amountCharged = rates.length > 0 ? Number(rates[0].price) : 0;
    } else {
      const [rates] = await pool.query(
        `SELECT price FROM court_rates 
         WHERE sport_id = (SELECT sport_id FROM courts WHERE id = ?) 
           AND plan_id IS NULL 
         ORDER BY id ASC LIMIT 1`,
        [court_id]
      );
      amountCharged = rates.length > 0 ? Number(rates[0].price) : 500;
    }

    const resType = reservation_type === 'social' ? 'social' : 'exclusive';
    const socialCapacity = resType === 'social' ? 8 : null;

    // 5. Insert Reservation & Booking safely within a transaction
    const conn = await pool.getConnection();
    let resResult, bookResult, bookingRef;
    try {
      await conn.beginTransaction();

      [resResult] = await conn.query(
        `INSERT INTO court_reservations (court_id, starts_at, ends_at, reservation_type, status, social_capacity, created_at) 
         VALUES (?, ?, ?, ?, 'active', ?, NOW())`,
        [court_id, starts_at, ends_at, resType, socialCapacity]
      );

      bookingRef = 'BKNG-' + Date.now();
      const priceBasis = amountCharged === 0 ? 'plan_included' : (activePlan ? 'member_rate' : 'walk_in_rate');
      const bookingNotes = req.body.razorpay_payment_id 
        ? `Paid via Razorpay (${req.body.razorpay_payment_id}). ${notes || ''}`.trim()
        : (notes || 'Online Member Reservation');

      [bookResult] = await conn.query(
        `INSERT INTO bookings (booking_ref, reservation_id, reservation_type, member_id, booked_via, price_basis, status, amount_charged, notes, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 'member_app', ?, 'confirmed', ?, ?, NOW(), NOW())`,
        [bookingRef, resResult.insertId, resType, member.id, priceBasis, amountCharged, bookingNotes]
      );

      await conn.commit();
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }

    // Fetch court details for clear notification message
    const [courtRows] = await pool.query('SELECT name FROM courts WHERE id = ?', [court_id]);
    const courtName = courtRows[0]?.name || `Court ${court_id}`;

    // 1. Send push/in-app notification to member
    createAndSendNotification({
      recipient_user_id: userId,
      title: 'Court Reservation Confirmed',
      body: `Your booking for ${courtName} (${starts_at.replace('T', ' ').slice(0, 16)}) is confirmed! Reference: ${bookingRef}`,
      type: 'booking',
      entity_type: 'booking',
      entity_id: bookResult.insertId,
    }).catch(err => console.error('[Notif booking error]', err.message));

    // 2. Broadcast slot booked event to all calendar clients via WebSocket
    broadcast({
      type: 'COURT_SLOT_BOOKED',
      courtId: court_id,
      courtName,
      startsAt: starts_at,
      endsAt: ends_at,
      bookingRef,
      reservationId: resResult.insertId,
    });

    // 3. Notify front desk staff
    sendToRole('RECEPTIONIST', {
      type: 'NOTIFICATION',
      notification: {
        title: 'New Member Booking',
        body: `${member.full_name || 'Member'} reserved ${courtName} for ${starts_at.replace('T', ' ').slice(0, 16)}`,
        type: 'booking',
        created_at: new Date().toISOString(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Court booking confirmed successfully!',
      bookingId: bookResult.insertId,
      bookingRef,
      reservationId: resResult.insertId,
      amount_charged: amountCharged,
    });
  } catch (error) {
    console.error('[createMyBooking]', error);
    res.status(500).json({ success: false, message: 'Failed to create court booking: ' + (error.sqlMessage || error.message) });
  }
}

async function cancelMyBooking(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);
    const { id } = req.params;

    // Verify ownership and reservation start time
    const [bookings] = await pool.query(
      `SELECT b.id, b.member_id, b.reservation_id, b.booking_ref, r.court_id, 
              DATE_FORMAT(r.starts_at, '%Y-%m-%d %H:%i:%s') as starts_at_str,
              DATE_FORMAT(r.ends_at, '%Y-%m-%d %H:%i:%s') as ends_at_str,
              r.starts_at, r.ends_at, c.name as court_name
       FROM bookings b 
       JOIN court_reservations r ON b.reservation_id = r.id 
       JOIN courts c ON r.court_id = c.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0 || bookings[0].member_id !== member.id) {
      res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking.' });
      return;
    }

    // Cutoff rule: Must cancel at least 2 hours before start time
    const startsAt = new Date(bookings[0].starts_at);
    const now = new Date();
    const diffHours = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      res.status(400).json({
        success: false,
        message: 'Cancellation deadline passed: Bookings must be cancelled at least 2 hours before the start time.',
      });
      return;
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = 'Cancelled by Member' WHERE id = ?`,
      [id]
    );

    if (bookings[0].reservation_id) {
      await pool.query(`UPDATE court_reservations SET status = 'cancelled' WHERE id = ?`, [bookings[0].reservation_id]);
    }

    // 1. Send push/in-app notification to member
    createAndSendNotification({
      recipient_user_id: userId,
      title: 'Booking Cancelled',
      body: `Your booking for ${bookings[0].court_name || 'Court'} (${bookings[0].booking_ref}) has been cancelled.`,
      type: 'booking',
      entity_type: 'booking',
      entity_id: bookings[0].id,
    }).catch(err => console.error('[Notif cancel error]', err.message));

    // 2. Broadcast slot freed event via WebSocket
    broadcast({
      type: 'COURT_SLOT_CANCELLED',
      courtId: bookings[0].court_id,
      startsAt: bookings[0].starts_at_str || bookings[0].starts_at,
      endsAt: bookings[0].ends_at_str || bookings[0].ends_at,
      bookingId: bookings[0].id,
    });

    res.json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('[cancelMyBooking]', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
}

// ============================================
// 3. BILLING & ONLINE PAYMENTS
// ============================================

async function getMyInvoices(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);

    const [invoices] = await pool.query(
      `SELECT id, invoice_no, total_amount, amount_paid, balance_due, issue_date, due_date, status, notes 
       FROM invoices 
       WHERE member_id = ? 
       ORDER BY due_date DESC`,
      [member.id]
    );

    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('[getMyInvoices]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
}

async function initOnlinePayment(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);
    const { invoice_id, amount, method } = req.body;

    if (!invoice_id || !amount) {
      res.status(400).json({ success: false, message: 'Invoice ID and payment amount are required' });
      return;
    }

    const payAmount = Number(amount);
    const receiptNo = 'REC-PAY-' + Date.now();
    const payMethod = method || 'online';

    // 1. Record payment
    const [result] = await pool.query(
      `INSERT INTO payments (receipt_no, invoice_id, amount, method, status, notes, paid_at, created_at) 
       VALUES (?, ?, ?, ?, 'success', 'Member Self-Service Online Payment', NOW(), NOW())`,
      [receiptNo, invoice_id, payAmount, payMethod]
    );

    // 2. Deduct invoice balance
    await pool.query(
      `UPDATE invoices 
       SET amount_paid = COALESCE(amount_paid, 0) + ?, balance_due = balance_due - ? 
       WHERE id = ?`,
      [payAmount, payAmount, invoice_id]
    );

    // 3. If balance cleared, mark paid
    const [invRows] = await pool.query('SELECT balance_due, invoice_no FROM invoices WHERE id = ?', [invoice_id]);
    if (invRows.length > 0 && Number(invRows[0].balance_due) <= 0) {
      await pool.query(`UPDATE invoices SET status = 'paid', balance_due = 0 WHERE id = ?`, [invoice_id]);
    }

    res.status(201).json({
      success: true,
      message: 'Payment completed successfully!',
      paymentId: result.insertId,
      receipt_no: receiptNo,
      invoice_no: invRows[0]?.invoice_no,
      amount: payAmount,
      paid_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[initOnlinePayment]', error);
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
}

// ============================================
// 4. PRO SHOP & ORDERS
// ============================================

async function getProducts(_req, res) {
  try {
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.brand, p.description, p.base_price, p.image_url, 
              c.name as category_name
       FROM products p 
       LEFT JOIN product_categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND p.is_listed_online = 1
       ORDER BY p.id ASC`
    );

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('[getProducts]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
}

async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);

    const [orders] = await pool.query(
      `SELECT o.* 
       FROM shop_orders o 
       WHERE o.member_id = ? 
       ORDER BY o.placed_at DESC`,
      [member.id]
    );

    // Fetch order items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT id, product_name, quantity, unit_price, line_total 
         FROM shop_order_items 
         WHERE order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('[getMyOrders]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
}

async function placeMyOrder(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);
    const { items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order items are required' });
      return;
    }

    const orderNo = 'ORD-' + Date.now();
    let subtotal = 0;

    for (const item of items) {
      subtotal += (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
    }

    // Insert order (channel: 'online', fulfillment_type: 'pickup', status: 'confirmed')
    const [orderResult] = await pool.query(
      `INSERT INTO shop_orders (order_no, member_id, channel, fulfillment_type, status, subtotal, total_amount, notes, placed_at, updated_at) 
       VALUES (?, ?, 'online', 'pickup', 'confirmed', ?, ?, ?, NOW(), NOW())`,
      [orderNo, member.id, subtotal, subtotal, notes || 'Online Member Order']
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      const lineTotal = (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
      await pool.query(
        `INSERT INTO shop_order_items (order_id, variant_id, product_name, quantity, unit_price, line_total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.variant_id || 1,
          item.product_name || 'Club Gear',
          item.quantity || 1,
          item.unit_price || 0,
          lineTotal,
        ]
      );
    }

    // 1. Send in-app notification to member
    createAndSendNotification({
      recipient_user_id: userId,
      title: 'Pro Shop Order Placed',
      body: `Your order #${orderNo} (₹${subtotal.toLocaleString('en-IN')}) has been placed and is being prepared for pickup.`,
      type: 'order',
      entity_type: 'shop_order',
      entity_id: orderId,
    }).catch(err => console.error('[Notif order error]', err.message));

    // 2. Notify front desk staff
    sendToRole('RECEPTIONIST', {
      type: 'NOTIFICATION',
      notification: {
        title: 'New Pro Shop Order',
        body: `Order #${orderNo} (₹${subtotal.toLocaleString('en-IN')}) placed by ${member.full_name || 'Member'}.`,
        type: 'order',
        created_at: new Date().toISOString(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Shop order placed successfully!',
      orderId,
      order_no: orderNo,
      total_amount: subtotal,
    });
  } catch (error) {
    console.error('[placeMyOrder]', error);
    res.status(500).json({ success: false, message: 'Failed to place shop order' });
  }
}

// ============================================
// 5. MEMBERSHIP PLANS & ACTIVATION
// ============================================

async function getMembershipPlans(req, res) {
  try {
    const [plans] = await pool.query(
      `SELECT id, code, name, description, fee, duration_months, joining_fee, min_age, max_age, 
              shop_discount_pct, bar_discount_pct, can_join_social_play, is_active, sort_order 
       FROM membership_plans 
       WHERE is_active = 1 
       ORDER BY sort_order ASC`
    );
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('[getMembershipPlans]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch membership plans' });
  }
}

async function subscribeMembershipPlan(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);
    const { plan_id, plan_code } = req.body;

    if (!plan_id && !plan_code) {
      res.status(400).json({ success: false, message: 'Membership plan is required' });
      return;
    }

    let planQuery = 'SELECT * FROM membership_plans WHERE is_active = 1 AND (id = ? OR code = ?) LIMIT 1';
    const [planRows] = await pool.query(planQuery, [plan_id || 0, plan_code || '']);

    if (planRows.length === 0) {
      res.status(404).json({ success: false, message: 'Selected membership plan not found or inactive' });
      return;
    }

    const plan = planRows[0];

    // Mark previous active memberships as expired/upgraded
    await pool.query(
      `UPDATE memberships SET status = 'expired', updated_at = NOW() WHERE member_id = ? AND status = 'active'`,
      [member.id]
    );

    // Create the new active membership
    const durationMonths = Number(plan.duration_months) || 12;
    const feeCharged = Number(plan.fee) || 0;
    const joiningFeeCharged = Number(plan.joining_fee) || 0;

    const [memResult] = await pool.query(
      `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, started_as, fee_charged, joining_fee_charged, created_at, updated_at)
       VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? MONTH), 'active', 'new', ?, ?, NOW(), NOW())`,
      [member.id, plan.id, durationMonths, feeCharged, joiningFeeCharged]
    );

    // Fetch the updated active membership
    const [activeRows] = await pool.query(
      `SELECT m.*, p.name as plan_name, p.code as plan_code, p.description as plan_description, p.fee as plan_fee 
       FROM memberships m 
       JOIN membership_plans p ON m.plan_id = p.id 
       WHERE m.id = ? LIMIT 1`,
      [memResult.insertId]
    );

    // 1. Send in-app notification to member
    createAndSendNotification({
      recipient_user_id: userId,
      title: 'VIP Pass Activated',
      body: `Congratulations! Your ${plan.name} Sanctuary Pass is now active with full privileges.`,
      type: 'membership',
      entity_type: 'membership',
      entity_id: memResult.insertId,
    }).catch(err => console.error('[Notif plan error]', err.message));

    // 2. Notify club admin
    sendToRole('ADMIN', {
      type: 'NOTIFICATION',
      notification: {
        title: 'New VIP Membership',
        body: `${member.full_name || 'Member'} upgraded to ${plan.name} pass.`,
        type: 'membership',
        created_at: new Date().toISOString(),
      },
    });

    res.status(201).json({
      success: true,
      message: `Congratulations! Your ${plan.name} Sanctuary Pass is now active.`,
      active_membership: activeRows[0],
    });
  } catch (error) {
    console.error('[subscribeMembershipPlan]', error);
    res.status(500).json({ success: false, message: 'Failed to activate membership plan' });
  }
}

async function simulateMemberStatus(req, res) {
  try {
    const userId = req.user.id;
    const member = await getOrCreateMember(userId, req.user.email, req.user.name);
    const { status } = req.body;

    if (status === 'inactive') {
      await pool.query(
        `UPDATE memberships SET status = 'expired', updated_at = NOW() WHERE member_id = ? AND status = 'active'`,
        [member.id]
      );
      res.json({ success: true, message: 'Simulated: Member has no active pass' });
      return;
    }

    if (status === 'expiring_soon') {
      const [actives] = await pool.query(
        `SELECT id FROM memberships WHERE member_id = ? AND status = 'active' LIMIT 1`,
        [member.id]
      );
      if (actives.length > 0) {
        await pool.query(
          `UPDATE memberships SET end_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY), updated_at = NOW() WHERE id = ?`,
          [actives[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, started_as, fee_charged, joining_fee_charged, created_at, updated_at)
           VALUES (?, 1, DATE_SUB(CURDATE(), INTERVAL 362 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'active', 'new', 7999, 1000, NOW(), NOW())`,
          [member.id]
        );
      }
      res.json({ success: true, message: 'Simulated: Gold pass expires in 3 days' });
      return;
    }

    if (status === 'gold') {
      await pool.query(
        `UPDATE memberships SET status = 'expired', updated_at = NOW() WHERE member_id = ? AND status = 'active'`,
        [member.id]
      );
      await pool.query(
        `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, started_as, fee_charged, joining_fee_charged, created_at, updated_at)
         VALUES (?, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 'active', 'new', 7999, 1000, NOW(), NOW())`,
        [member.id]
      );
      res.json({ success: true, message: 'Simulated: Active Gold pass (1 year)' });
      return;
    }

    res.status(400).json({ success: false, message: 'Unknown status simulation' });
  } catch (error) {
    console.error('[simulateMemberStatus]', error);
    res.status(500).json({ success: false, message: 'Simulation error' });
  }
}

module.exports = {
  getMe,
  updateMe,
  getMembershipPlans,
  subscribeMembershipPlan,
  simulateMemberStatus,
  getCourtAvailability,
  getMyBookings,
  createMyBooking,
  cancelMyBooking,
  getMyInvoices,
  initOnlinePayment,
  getProducts,
  getMyOrders,
  placeMyOrder,
};
