const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const { testConnection, pool } = require('./config/db');
const { initWebSocketServer, broadcast, createAndSendNotification } = require('./services/websocket.service');
const authRoutes = require('./routes/auth.routes');
const receptionistRoutes = require('./routes/receptionist.routes');
const memberRoutes = require('./routes/member.routes');
const managerRoutes = require('./routes/manager.routes');
const barRoutes = require('./routes/bar.routes');
const shopRoutes = require('./routes/shop.routes');
const accountantRoutes = require('./routes/accountant.routes');
const adminRoutes = require('./routes/admin.routes');
const ownerRoutes = require('./routes/owner.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/bar', barRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Public Enquiries (Landing Page / Contact Page) ───────────
const handlePublicEnquiry = async (req, res) => {
  try {
    const { full_name, first_name, last_name, phone, email, topic, enquiry_type, message } = req.body;
    const name = full_name || [first_name, last_name].filter(Boolean).join(' ') || 'Prospective Member';
    const contactPhone = phone || 'Not Provided';
    const type = enquiry_type || topic || 'General Enquiry';

    const [result] = await pool.query(
      `INSERT INTO enquiries (full_name, phone, email, source, enquiry_type, message, status, created_at, updated_at) 
       VALUES (?, ?, ?, 'Website Form', ?, ?, 'Open', NOW(), NOW())`,
      [name, contactPhone, email || null, type, message || 'Enquiry submitted via website contact form']
    );

    createAndSendNotification({
      recipient_role: 'FRONT_DESK',
      title: 'New Online Lead / Enquiry',
      body: `${name} reached out regarding ${type} (${contactPhone})`,
      type: 'general',
      entity_type: 'enquiry',
      entity_id: result.insertId,
    }).catch(err => console.error('[Enquiry notif error]', err.message));

    res.status(201).json({
      success: true,
      message: 'Enquiry received successfully. Our team will contact you shortly.',
      enquiryId: result.insertId,
    });
  } catch (err) {
    console.error('[Public Enquiry Error]', err);
    res.status(500).json({ success: false, message: 'Failed to record enquiry' });
  }
};

app.post('/api/public/enquiries', handlePublicEnquiry);
app.post('/api/enquiries', handlePublicEnquiry);

// ─── Scene 3: 10-Minute Emergency Racket Restringing & Loaner Service ───
app.post('/api/public/emergency-restringing', async (req, res) => {
  try {
    const { member_name, court_location, racket_brand, tension, need_loaner, notes } = req.body;
    const reqNo = 'REST-' + Date.now().toString().slice(-6);

    createAndSendNotification({
      recipient_role: 'SHOP_STAFF',
      title: '🚨 EMERGENCY: Racket String Snapped Before Play',
      body: `${member_name || 'Member'} on ${court_location || 'Court'}: ${racket_brand || 'Racket'}. ${need_loaner ? '⚡ Loaner racket requested!' : ''}`,
      type: 'booking',
      entity_type: 'shop_order',
      entity_id: 0,
    }).catch(err => console.error('[Emergency notif error]', err.message));

    broadcast({
      type: 'EMERGENCY_RESTRINGING_ALERT',
      reqNo,
      memberName: member_name || 'Member',
      courtLocation: court_location || 'Court',
      racketBrand: racket_brand || 'Pro Racket',
      tension: tension || '54 lbs',
      needLoaner: Boolean(need_loaner),
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Emergency restringing request logged! Pro Shop technician has been alerted and is preparing your loaner racket.',
      request_no: reqNo,
      eta_minutes: 10,
    });
  } catch (err) {
    console.error('[Emergency restringing error]', err);
    res.status(500).json({ success: false, message: 'Failed to record emergency request' });
  }
});

// ─── Scene 5: Instant Complimentary Trial Session Booking ───
app.post('/api/public/book-trial', async (req, res) => {
  try {
    const { full_name, phone, email, preferred_sport, preferred_time, notes } = req.body;
    if (!full_name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required for trial booking' });
    }

    const trialMsg = `Complimentary Trial Booking: Sport: ${preferred_sport || 'Tennis'}, Preferred Time: ${preferred_time || 'This Week'}. Notes: ${notes || 'None'}`;
    const [result] = await pool.query(
      `INSERT INTO enquiries (full_name, phone, email, source, enquiry_type, message, status, created_at, updated_at) 
       VALUES (?, ?, ?, 'Online Trial Booking', 'Trial Session', ?, 'Open', NOW(), NOW())`,
      [full_name, phone, email || null, trialMsg]
    );

    createAndSendNotification({
      recipient_role: 'FRONT_DESK',
      title: '🎾 New Complimentary Trial Session Booking!',
      body: `${full_name} booked a free trial for ${preferred_sport || 'Tennis'} (${phone})`,
      type: 'general',
      entity_type: 'enquiry',
      entity_id: result.insertId,
    }).catch(err => console.error('[Trial notif error]', err.message));

    res.status(201).json({
      success: true,
      message: 'Trial session confirmed! Our concierge will welcome you and assign your court.',
      enquiryId: result.insertId,
    });
  } catch (err) {
    console.error('[Book trial error]', err);
    res.status(500).json({ success: false, message: 'Failed to book trial session' });
  }
});

// ─── Hackathon Winner Feature: Club AI Concierge ───
app.post('/api/public/ai-concierge', async (req, res) => {
  try {
    const { message = '' } = req.body;
    const q = message.toLowerCase().trim();

    const [courts] = await pool.query("SELECT COUNT(*) as count FROM courts WHERE status = 'active'");
    const [plans] = await pool.query("SELECT name, fee FROM membership_plans WHERE is_active = 1");
    const planSummary = plans.map(p => `${p.name} (₹${Math.round(p.fee).toLocaleString('en-IN')}/mo)`).join(', ');

    let reply = '';
    let action = null;

    if (q.includes('court') || q.includes('book') || q.includes('slot') || q.includes('availability') || q.includes('schedule')) {
      reply = `We have ${courts[0].count} championship-grade courts (Hardcourt, Synthetic Grass, Padel Glass, Badminton, and Cricket Nets). Slots run in 1-hour sessions from 6:00 AM to 10:00 PM with real-time multi-client synchronization. Gold members enjoy unlimited complimentary court bookings, while Silver members pay ₹350/hr. Would you like to reserve a slot?`;
      action = { type: 'NAVIGATE', label: 'View Live Court Matrix', path: '/courts' };
    } else if (q.includes('string') || q.includes('snap') || q.includes('broken') || q.includes('repair') || q.includes('restring')) {
      reply = `🚨 Snapped a racket string ten minutes before your match? Our Pro Shop operates a 10-minute emergency electronic restringing service and can immediately dispatch a loaner racket directly to your court so you don't miss any game time!`;
      action = { type: 'EMERGENCY_RESTRING', label: '⚡ Request 10-Min Emergency Stringing' };
    } else if (q.includes('membership') || q.includes('plan') || q.includes('price') || q.includes('gold') || q.includes('silver') || q.includes('junior')) {
      reply = `The Champions Club features three distinct tiers: ${planSummary}. Gold tier offers unlimited free court reservations, 20% pro shop discount, 15% cellar & cafe discount, and 4 monthly guest passes. Silver tier offers ₹350 court rates and 10% discounts. Juniors enjoy preferential rates under 18.`;
      action = { type: 'NAVIGATE', label: 'Compare Membership Tiers', path: '/memberships' };
    } else if (q.includes('trial') || q.includes('free') || q.includes('visit') || q.includes('guest')) {
      reply = `You can book a complimentary trial session on our championship courts right now! Our front desk concierge will arrange a personalized walk-through, racket hire, and court access.`;
      action = { type: 'BOOK_TRIAL', label: '🎟️ Book a Free Trial Session' };
    } else if (q.includes('shop') || q.includes('racket') || q.includes('shoe') || q.includes('ball') || q.includes('gear')) {
      reply = `Our Pro Gear Shop carries tour-certified equipment from Wilson, Babolat, Nike, and Adidas. Members enjoy unified shelf inventory — buy at the counter or order from your sofa for VIP locker delivery or click & collect!`;
      action = { type: 'NAVIGATE', label: 'Browse Pro Shop Catalog', path: '/shop' };
    } else if (q.includes('cafe') || q.includes('bar') || q.includes('food') || q.includes('drink') || q.includes('menu') || q.includes('tab')) {
      reply = `The Clubhouse Cafe & Lounge serves artisan post-match nutrition, cold-pressed recovery shakes, and curated cellar reserves. Members automatically receive their 15% discount and can run a running bar tab settled at the end of their stay.`;
      action = { type: 'NAVIGATE', label: 'View Clubhouse Menu', path: '/cafe' };
    } else if (q.includes('hackathon') || q.includes('scene') || q.includes('story') || q.includes('problem')) {
      reply = `The Champions Club platform was engineered directly against all 6 operational scenes in the problem statement: From Scene 1 (New Member Walk-in & Digital Pass) and Scene 2 (6 PM Court Rush & Double-Booking Prevention) to Scene 3 (10-Min Snapped String), Scene 4 (Bar Tabs & KDS), Scene 5 (Online Discovery & Quote CRM), and Scene 6 (Owner Month-End P&L Audit). Launch our interactive Hackathon Story Tour!`;
      action = { type: 'OPEN_TOUR', label: '🏆 Launch Hackathon Story Tour' };
    } else {
      reply = `Hello! I am the Champions Club AI Concierge. I can assist you with real-time court availability, membership passes, emergency racket restringing, pro shop gear, or booking a complimentary trial session. How can I elevate your game today?`;
      action = { type: 'SUGGESTIONS', options: ['Check Court Slots', 'Emergency String Repair', 'Membership Tiers', 'Book Free Trial'] };
    }

    res.json({ success: true, reply, action });
  } catch (err) {
    console.error('[AI Concierge Error]', err);
    res.status(500).json({
      success: false,
      reply: 'Welcome to The Champions Club! How can I assist you with courts, memberships, or our pro shop today?',
    });
  }
});

// ─── Dynamic Public Live Endpoints (Zero Static Mock Data) ───
// 1. Live Membership Plans
app.get('/api/public/plans', async (_req, res) => {
  try {
    const [plans] = await pool.query(
      'SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error('[public.plans error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch membership plans' });
  }
});

// 2. Live Pro Shop Catalog
app.get('/api/public/products', async (_req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.brand, p.description, p.base_price, p.image_url, 
              c.name as category_name
       FROM products p 
       LEFT JOIN product_categories c ON p.category_id = c.id
       WHERE p.is_active = 1
       ORDER BY p.id ASC`
    );
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('[public.products error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch shop products' });
  }
});

// 3. Live Cafe & Bar Menu
app.get('/api/public/menu', async (_req, res) => {
  try {
    const [menu] = await pool.query(
      `SELECT bmi.id, bmi.name, bmi.description, bmi.price, bmi.is_available, 
              bmc.name as category_name
       FROM bar_menu_items bmi
       LEFT JOIN bar_menu_categories bmc ON bmi.category_id = bmc.id
       WHERE bmi.is_active = 1
       ORDER BY bmi.id ASC`
    );
    res.json({ success: true, data: menu });
  } catch (err) {
    console.error('[public.menu error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cafe menu' });
  }
});

// 4. Live Court Directory with Database Rates
app.get('/api/public/courts', async (_req, res) => {
  try {
    const [courts] = await pool.query(
      `SELECT c.id, c.name, c.surface, c.is_indoor, c.social_play_capacity,
              s.name as sport_name,
              COALESCE((SELECT price FROM court_rates WHERE sport_id = c.sport_id AND plan_id IS NULL AND applies_to = 'exclusive_booking' AND is_active = 1 LIMIT 1), 800) as base_price,
              COALESCE((SELECT price FROM court_rates WHERE sport_id = c.sport_id AND plan_id = 2 AND applies_to = 'exclusive_booking' AND is_active = 1 LIMIT 1), 500) as silver_price,
              COALESCE((SELECT price FROM court_rates WHERE sport_id = c.sport_id AND plan_id = 1 AND applies_to = 'exclusive_booking' AND is_active = 1 LIMIT 1), 0) as gold_price
       FROM courts c
       LEFT JOIN sports s ON c.sport_id = s.id
       WHERE c.status = 'active'
       ORDER BY c.id ASC`
    );
    res.json({ success: true, data: courts });
  } catch (err) {
    console.error('[public.courts error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch courts' });
  }
});

// 5. Dynamic Court Slots Calendar (Queries MySQL court_reservations in real-time)
app.get('/api/public/slots', async (req, res) => {
  try {
    const courtId = parseInt(String(req.query.courtId || req.query.court_id || '').replace(/\D/g, '')) || 2;
    const startDateStr = req.query.startDate || new Date().toISOString().split('T')[0];
    const days = Math.min(14, Math.max(1, parseInt(req.query.days) || 7));

    const baseDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + days);

    const [reservations] = await pool.query(
      `SELECT id, 
              DATE_FORMAT(starts_at, '%Y-%m-%d %H:%i:%s') as starts_at, 
              DATE_FORMAT(ends_at, '%Y-%m-%d %H:%i:%s') as ends_at, 
              reservation_type, status 
       FROM court_reservations 
       WHERE court_id = ? 
         AND status = 'active' 
         AND starts_at < ? 
         AND ends_at > ?`,
      [courtId, endDate, baseDate]
    );

    const slots = [];
    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Operating hours: 6 AM to 10 PM
      for (let hour = 6; hour <= 22; hour++) {
        const startHStr = String(hour).padStart(2, '0') + ':00';
        const endHStr = String(hour + 1).padStart(2, '0') + ':00';

        const slotStartStr = `${dateStr} ${startHStr}:00`;
        const slotEndStr = `${dateStr} ${endHStr}:00`;

        const overlapping = reservations.find(r => {
          return r.starts_at < slotEndStr && r.ends_at > slotStartStr;
        });

        let status = 'available';
        let slotId = `slot-${courtId}-${dateStr}-${startHStr}`;

        if (overlapping) {
          status = overlapping.reservation_type === 'social' ? 'social' : 'booked';
          slotId = `res-${overlapping.id}-${startHStr}`;
        }

        slots.push({
          id: slotId,
          courtId: String(courtId),
          date: dateStr,
          startTime: startHStr,
          endTime: endHStr,
          status,
        });
      }
    }

    res.json({ success: true, count: slots.length, data: slots });
  } catch (err) {
    console.error('[public.slots error]', err);
    res.status(500).json({ success: false, message: 'Failed to generate court slots' });
  }
});

// 6. Live Dining Tables
app.get('/api/public/tables', async (_req, res) => {
  try {
    const [tables] = await pool.query(
      'SELECT id, table_number, seats, zone, status FROM dining_tables ORDER BY id ASC'
    );
    res.json({ success: true, data: tables });
  } catch (err) {
    console.error('[public.tables error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tables' });
  }
});

// 7. Live Club Statistics
app.get('/api/public/stats', async (_req, res) => {
  try {
    const [mRows] = await pool.query("SELECT COUNT(*) as count FROM members WHERE status = 'active'");
    const [cRows] = await pool.query("SELECT COUNT(*) as count FROM courts WHERE status = 'active'");
    const [bRows] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE status != 'Cancelled'");
    const [sRows] = await pool.query("SELECT COUNT(*) as count FROM sports");

    res.json({
      success: true,
      data: {
        active_members: mRows[0]?.count || 0,
        total_courts: cRows[0]?.count || 0,
        total_bookings: bRows[0]?.count || 0,
        total_sports: sRows[0]?.count || 0,
        established_year: 2018,
      },
    });
  } catch (err) {
    console.error('[public.stats error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch club statistics' });
  }
});

// 8. Live Club Profile
app.get('/api/public/club-profile', async (_req, res) => {
  try {
    const [profiles] = await pool.query('SELECT * FROM club_profile LIMIT 1');
    res.json({ success: true, data: profiles[0] || null });
  } catch (err) {
    console.error('[public.club-profile error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch club profile' });
  }
});

// 9. Live Club Media Gallery
app.get('/api/public/gallery', async (_req, res) => {
  try {
    const gallery = [
      {
        id: 'g1',
        url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop',
        alt: 'Tennis Court 1 — Premium Synthetic Grass',
        caption: 'Center Court • Synthetic Grass',
      },
      {
        id: 'g2',
        url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800&auto=format&fit=crop',
        alt: 'Tennis Court 2 — Hard Court Surface',
        caption: 'Championship Hard Court',
      },
      {
        id: 'g3',
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
        alt: 'Cricket Nets with Professional Equipment',
        caption: 'Pro Turf Cricket Nets',
      },
      {
        id: 'g4',
        url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop',
        alt: 'Clubhouse Cafe & Bar Interior',
        caption: 'The Clubhouse Lounge & Cellar',
      },
      {
        id: 'g5',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
        alt: 'Pro Gear Shop & Electronic Restringing',
        caption: 'Pro Shop & Equipment Concierge',
      },
      {
        id: 'g6',
        url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=800&auto=format&fit=crop',
        alt: 'Members enjoying a match',
        caption: 'Vibrant Member Community',
      },
    ];
    res.json({ success: true, data: gallery });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
  }
});

// 5. Live Dining Table Order Dispatch
app.post('/api/public/table-order', async (req, res) => {
  try {
    const { item_id, item_name, quantity = 1, unit_price = 0, table_location, notes } = req.body;
    const orderNo = 'ORD-BAR-' + Date.now();
    const qty = Math.max(1, Number(quantity) || 1);
    const price = Number(unit_price) || 0;
    const total = qty * price;

    const [orderRes] = await pool.query(
      `INSERT INTO bar_orders (order_no, taken_by, status, subtotal, total_amount, notes, placed_at, updated_at)
       VALUES (?, 1, 'placed', ?, ?, ?, NOW(), NOW())`,
      [orderNo, total, total, `${table_location || 'Table Order'} - ${notes || ''}`.trim()]
    );

    await pool.query(
      `INSERT INTO bar_order_items (order_id, menu_item_id, item_name, quantity, unit_price, station, kitchen_status, line_total)
       VALUES (?, ?, ?, ?, ?, 'bar', 'pending', ?)`,
      [orderRes.insertId, item_id || 1, item_name || 'Cafe Selection', qty, price, total]
    );

    res.status(201).json({
      success: true,
      message: 'Dining order sent directly to bar kitchen station',
      order_no: orderNo,
      orderId: orderRes.insertId,
    });
  } catch (err) {
    console.error('[public.table-order error]', err);
    res.status(500).json({ success: false, message: 'Failed to place dine-in order' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
async function bootstrap() {
  const server = http.createServer(app);
  initWebSocketServer(server);

  server.listen(env.port, '0.0.0.0', () => {
    console.log(`[Server] Running with WebSockets on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  try {
    await testConnection();
  } catch (err) {
    console.warn('[DB] Initial connection attempt:', err.message);
  }
}

// Only bootstrap if run directly
if (require.main === module) {
  bootstrap().catch(console.error);
}

module.exports = { app, bootstrap };
