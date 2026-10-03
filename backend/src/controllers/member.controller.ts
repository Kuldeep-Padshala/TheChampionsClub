import { Request, Response } from 'express';
// @ts-ignore
import db from '../config/db.js';

// ============================================
// 1. Authentication & Profile
// ============================================

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Fetch member profile by user_id
    const [members]: any = await db.query('SELECT * FROM members WHERE user_id = ?', [userId]);
    if (members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }
    const member = members[0];
    
    // Fetch active membership plan
    const [memberships]: any = await db.query(
      `SELECT m.*, p.name as plan_name, p.description as plan_benefits 
       FROM memberships m 
       JOIN membership_plans p ON m.plan_id = p.id 
       WHERE m.member_id = ? AND m.status = 'Active'`, 
      [member.id]
    );

    res.status(200).json({ 
      success: true, 
      profile: member, 
      active_membership: memberships.length > 0 ? memberships[0] : null 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { phone, email, address_line1, emergency_contact_name, emergency_contact_phone } = req.body;
    
    await db.query(
      `UPDATE members 
       SET phone = COALESCE(?, phone), 
           email = COALESCE(?, email), 
           address_line1 = COALESCE(?, address_line1), 
           emergency_contact_name = COALESCE(?, emergency_contact_name), 
           emergency_contact_phone = COALESCE(?, emergency_contact_phone),
           updated_at = NOW() 
       WHERE user_id = ?`,
      [phone, email, address_line1, emergency_contact_name, emergency_contact_phone, userId]
    );

    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 2. Court Calendar & Bookings (Self-Booking)
// ============================================

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const [members]: any = await db.query('SELECT id FROM members WHERE user_id = ?', [userId]);
    if (members.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });
    
    const [bookings]: any = await db.query(
      `SELECT b.id, b.status, r.starts_at, r.ends_at, c.name as court_name 
       FROM bookings b 
       JOIN court_reservations r ON b.reservation_id = r.id 
       JOIN courts c ON r.court_id = c.id
       WHERE b.member_id = ? ORDER BY r.starts_at DESC`, 
      [members[0].id]
    );

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createMyBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { court_id, starts_at, ends_at, reservation_type } = req.body;
    
    // Get member details
    const [members]: any = await db.query('SELECT id FROM members WHERE user_id = ?', [userId]);
    if (members.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });
    const memberId = members[0].id;

    // 1. Check if membership is active
    const [memberships]: any = await db.query('SELECT * FROM memberships WHERE member_id = ? AND status = "Active"', [memberId]);
    if (memberships.length === 0) {
      return res.status(403).json({ success: false, message: 'Active membership required to book courts' });
    }

    // 2. Enforce "max 2 bookings a day"
    const bookingDate = new Date(starts_at).toISOString().split('T')[0];
    const [dailyBookings]: any = await db.query(
      `SELECT COUNT(*) as count 
       FROM bookings b 
       JOIN court_reservations r ON b.reservation_id = r.id 
       WHERE b.member_id = ? AND DATE(r.starts_at) = ? AND b.status != 'Cancelled'`,
      [memberId, bookingDate]
    );
    if (dailyBookings[0].count >= 2) {
      return res.status(429).json({ success: false, message: 'Maximum of 2 bookings allowed per day' });
    }

    // 3. Calculate Price (Member Discount)
    // Fetch rate from court_rates where plan_id matches the member's active plan
    const [rates]: any = await db.query(
      'SELECT price FROM court_rates WHERE sport_id = (SELECT sport_id FROM courts WHERE id = ?) AND plan_id = ? LIMIT 1',
      [court_id, memberships[0].plan_id]
    );
    const amount_charged = rates.length > 0 ? rates[0].price : 0; // Default to 0 or a base price if no specific rate found

    // 4. Create Reservation and Booking
    const [reservationResult]: any = await db.query(
      'INSERT INTO court_reservations (court_id, starts_at, ends_at, reservation_type, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [court_id, starts_at, ends_at, reservation_type, 'Confirmed']
    );

    const [bookingResult]: any = await db.query(
      'INSERT INTO bookings (reservation_id, member_id, status, amount_charged, created_at) VALUES (?, ?, ?, ?, NOW())',
      [reservationResult.insertId, memberId, 'Confirmed', amount_charged]
    );

    res.status(201).json({ success: true, message: 'Booking confirmed', bookingId: bookingResult.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const cancelMyBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params; // Booking ID
    
    const [members]: any = await db.query('SELECT id FROM members WHERE user_id = ?', [userId]);
    const memberId = members[0].id;

    // Check ownership and time
    const [bookings]: any = await db.query(
      `SELECT b.member_id, b.reservation_id, r.starts_at 
       FROM bookings b 
       JOIN court_reservations r ON b.reservation_id = r.id 
       WHERE b.id = ?`, 
      [id]
    );

    if (bookings.length === 0 || bookings[0].member_id !== memberId) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    // Cutoff time: 2 hours before
    const startsAt = new Date(bookings[0].starts_at);
    const now = new Date();
    const diffHours = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 2) {
      return res.status(400).json({ success: false, message: 'Cannot cancel less than 2 hours before start time' });
    }

    await db.query('UPDATE bookings SET status = "Cancelled", cancelled_at = NOW() WHERE id = ?', [id]);
    await db.query('UPDATE court_reservations SET status = "Cancelled" WHERE id = ?', [bookings[0].reservation_id]);

    res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. Billing & Online Payments
// ============================================

export const getMyInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [members]: any = await db.query('SELECT id FROM members WHERE user_id = ?', [userId]);
    const memberId = members[0].id;

    const [invoices]: any = await db.query('SELECT * FROM invoices WHERE member_id = ? ORDER BY created_at DESC', [memberId]);
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const initOnlinePayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { invoice_id, amount } = req.body;
    
    // In a real scenario, you'd integrate Razorpay or Stripe SDK here.
    // Const session = await stripe.checkout.sessions.create({...})
    const paymentLink = `https://checkout.stripe.com/pay/test_${Date.now()}`;

    res.status(200).json({ 
      success: true, 
      message: 'Payment initialized', 
      paymentLink 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. Shop & E-Commerce
// ============================================

export const getProducts = async (req: Request, res: Response) => {
  try {
    const [products]: any = await db.query('SELECT * FROM products WHERE is_active = 1 AND is_listed_online = 1');
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [members]: any = await db.query('SELECT id FROM members WHERE user_id = ?', [userId]);
    const memberId = members[0].id;

    const [orders]: any = await db.query('SELECT * FROM shop_orders WHERE member_id = ? ORDER BY created_at DESC', [memberId]);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const placeMyOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { total_amount, items } = req.body; // items: array of { variant_id, quantity, unit_price }
    
    const [members]: any = await db.query('SELECT id FROM members WHERE user_id = ?', [userId]);
    const memberId = members[0].id;
    const order_no = 'ORD-' + Date.now();

    const [orderResult]: any = await db.query(
      'INSERT INTO shop_orders (order_no, member_id, status, total_amount, placed_at, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [order_no, memberId, 'Pending', total_amount]
    );
    const orderId = orderResult.insertId;

    // Insert items
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          'INSERT INTO shop_order_items (order_id, variant_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.variant_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }

    res.status(201).json({ success: true, message: 'Order placed successfully', orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
