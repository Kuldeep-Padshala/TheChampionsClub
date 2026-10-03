const db = require('../config/db.js');
const crypto = require('crypto');

// ============================================
// 1. Executive Dashboard (Analytics & Health)
// ============================================

const getRevenueAnalytics = async (req, res) => {
  try {
    const { timeframe } = req.query; // 'day', 'week', 'month'
    
    let interval = '1 MONTH';
    if (timeframe === 'day') interval = '1 DAY';
    if (timeframe === 'week') interval = '1 WEEK';

    // Simple revenue breakdown estimation based on invoice item categories/notes or invoice tags
    // For demonstration, we aggregate total paid invoices and mock a realistic department split
    // In a real scenario, you'd join invoice_items with their source tables
    const [revenueData] = await db.query(
      'SELECT SUM(total_amount) as total ' +
      'FROM invoices ' +
      'WHERE status = "Paid" AND issue_date >= DATE_SUB(NOW(), INTERVAL ' + interval + ')'
    );

    const total = Number(revenueData[0].total || 0);

    // Mocking the split percentages for the dashboard visualization based on standard club metrics
    const split = {
      memberships: total * 0.40,
      courts: total * 0.30,
      bar: total * 0.20,
      shop: total * 0.10
    };

    res.status(200).json({ success: true, total_revenue: total, breakdown: split });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getOccupancyAnalytics = async (req, res) => {
  try {
    // Fetch total reservations vs total available court hours
    // Simplified: Just count the number of Confirmed bookings per court over the last 30 days
    const [occupancy] = await db.query(
      'SELECT c.name as court_name, COUNT(r.id) as total_bookings ' +
      'FROM courts c ' +
      'LEFT JOIN court_reservations r ON c.id = r.court_id AND r.status = "Confirmed" AND r.starts_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ' +
      'GROUP BY c.id'
    );

    res.status(200).json({ success: true, data: occupancy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getGrowthAnalytics = async (req, res) => {
  try {
    const [newMembers] = await db.query(
      'SELECT COUNT(*) as joined FROM memberships WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    const [cancelledMembers] = await db.query(
      'SELECT COUNT(*) as cancelled FROM memberships WHERE status IN ("Cancelled", "Expired") AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    res.status(200).json({
      success: true,
      data: {
        new_members: newMembers[0].joined,
        churned_members: cancelledMembers[0].cancelled,
        net_growth: newMembers[0].joined - cancelledMembers[0].cancelled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 2. Financial Approvals (The Final Sign-off)
// ============================================

const authorizePayroll = async (req, res) => {
  try {
    const { id } = req.params; // payroll_run_id

    // Update the run to 'Authorized' status allowing actual bank transfer
    await db.query('UPDATE payroll_runs SET status = "Authorized", approved_at = NOW() WHERE id = ?', [id]);
    
    // In real life, this might trigger a bank API integration to release funds

    res.status(200).json({ success: true, message: 'Payroll run authorized for final payout by Owner' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const authorizeExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('UPDATE expenses SET status = "Owner_Approved", updated_at = NOW() WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Large expense authorized by Owner' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. Business Strategy (Pricing & Plans)
// ============================================

const createMembershipPlan = async (req, res) => {
  try {
    const { name, description, duration_months, price, benefits } = req.body;

    const [plan] = await db.query(
      'INSERT INTO membership_plans (name, description, duration_months, price, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [name, description, duration_months, price]
    );

    if (benefits && benefits.length > 0) {
      const values = benefits.map(b => [plan.insertId, b]);
      await db.query('INSERT INTO plan_benefits (plan_id, description) VALUES ?', [values]);
    }

    res.status(201).json({ success: true, message: 'New membership plan strategy deployed', planId: plan.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const manageDiscounts = async (req, res) => {
  try {
    // Assuming a simplified configuration where discounts are toggled in club_settings or benefits
    const { target, discount_percent } = req.body; 

    // E.g., Insert a global setting for Shop Discounts for Members
    await db.query(
      'INSERT INTO club_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()',
      ['GLOBAL_DISCOUNT_' + target.toUpperCase(), discount_percent, discount_percent]
    );

    res.status(200).json({ success: true, message: 'Global discount strategy updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. External Reporting (Investors & Auditors)
// ============================================

const generateReportShare = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { report_type, recipient_email } = req.body; // e.g. "PNL", "TAX"

    // Generate a secure, unguessable token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Link expires in 7 days
    const [share] = await db.query(
      'INSERT INTO report_shares (report_type, token, created_by, expires_at, created_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())',
      [report_type, token, ownerId]
    );

    const secureLink = 'https://portal.thechampionsclub.com/reports/share/' + token;

    // Ideally, send email to recipient_email here with the secureLink

    res.status(201).json({ 
      success: true, 
      message: 'Secure report link generated successfully', 
      secure_link: secureLink,
      expires_in: '7 Days'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getRevenueAnalytics,
  getOccupancyAnalytics,
  getGrowthAnalytics,
  authorizePayroll,
  authorizeExpense,
  createMembershipPlan,
  manageDiscounts,
  generateReportShare
};
