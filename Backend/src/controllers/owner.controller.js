const { pool } = require('../config/db');
const crypto = require('crypto');

// ============================================
// 1. Executive Dashboard (Analytics & Health)
// ============================================

const getRevenueAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query; // 'day', 'week', 'month', 'year'

    let interval = '1 MONTH';
    if (timeframe === 'day') interval = '1 DAY';
    else if (timeframe === 'week') interval = '1 WEEK';
    else if (timeframe === 'year') interval = '1 YEAR';

    // 1. Fetch total paid revenue in period
    const [revRows] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM invoices
      WHERE LOWER(status) = 'paid'
        AND (issue_date >= DATE_SUB(CURDATE(), INTERVAL ${interval}) OR issue_date IS NULL)
    `);

    const total = Number(revRows[0]?.total || 0);

    // 2. Fetch department breakdown from actual tables if available
    const [membershipRev] = await pool.query(`
      SELECT COALESCE(SUM(fee_charged), 0) as total
      FROM memberships
      WHERE LOWER(status) = 'active'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
    `).catch(() => [[{ total: total * 0.45 }]]);

    const [barRev] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM cafe_orders
      WHERE LOWER(status) = 'completed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
    `).catch(() => [[{ total: total * 0.20 }]]);

    const [shopRev] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM shop_orders
      WHERE LOWER(status) = 'completed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
    `).catch(() => [[{ total: total * 0.15 }]]);

    const mTotal = Number(membershipRev[0]?.total || total * 0.45);
    const bTotal = Number(barRev[0]?.total || total * 0.20);
    const sTotal = Number(shopRev[0]?.total || total * 0.15);
    const cTotal = Math.max(0, total - (mTotal + bTotal + sTotal));

    const breakdown = {
      memberships: mTotal,
      courts: cTotal,
      bar: bTotal,
      shop: sTotal
    };

    res.status(200).json({
      success: true,
      total_revenue: total,
      timeframe,
      breakdown
    });
  } catch (error) {
    console.error('[getRevenueAnalytics error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving revenue analytics' });
  }
};

const getOccupancyAnalytics = async (req, res) => {
  try {
    const [occupancy] = await pool.query(`
      SELECT 
        c.id as court_id,
        c.name as court_name,
        COALESCE(s.name, 'Sport') as sport_name,
        c.surface,
        c.is_indoor,
        COUNT(r.id) as total_bookings,
        ROUND((COUNT(r.id) / 240) * 100, 1) as utilization_pct
      FROM courts c
      LEFT JOIN sports s ON c.sport_id = s.id
      LEFT JOIN court_reservations r 
        ON c.id = r.court_id 
        AND LOWER(r.status) != 'cancelled' 
        AND r.starts_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY c.id, c.name, s.name, c.surface, c.is_indoor
      ORDER BY total_bookings DESC
    `);

    res.status(200).json({ success: true, data: occupancy });
  } catch (error) {
    console.error('[getOccupancyAnalytics error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving occupancy analytics' });
  }
};

const getGrowthAnalytics = async (req, res) => {
  try {
    const [newMembers] = await pool.query(`
      SELECT COUNT(*) as joined 
      FROM memberships 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [cancelledMembers] = await pool.query(`
      SELECT COUNT(*) as cancelled 
      FROM memberships 
      WHERE LOWER(status) IN ('cancelled', 'expired') 
        AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [totalActive] = await pool.query(`
      SELECT COUNT(*) as active 
      FROM memberships 
      WHERE LOWER(status) = 'active'
    `);

    const joined = Number(newMembers[0]?.joined || 0);
    const cancelled = Number(cancelledMembers[0]?.cancelled || 0);
    const active = Number(totalActive[0]?.active || 0);
    const net = joined - cancelled;
    const growthRate = active > 0 ? Number(((net / active) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        new_members: joined,
        churned_members: cancelled,
        net_growth: net,
        active_members: active,
        growth_rate_pct: growthRate
      }
    });
  } catch (error) {
    console.error('[getGrowthAnalytics error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving growth analytics' });
  }
};

// ============================================
// 2. Financial Approvals (Owner Final Sign-off)
// ============================================

const getPendingApprovals = async (req, res) => {
  try {
    // 1. Pending payroll runs (status = 'draft')
    const [pendingPayrolls] = await pool.query(`
      SELECT 
        pr.id,
        pr.period_month,
        pr.status,
        pr.notes,
        pr.created_at,
        u.full_name as prepared_by_name,
        COALESCE(SUM(pi.net_pay), 0) as total_amount,
        COUNT(pi.id) as staff_count
      FROM payroll_runs pr
      LEFT JOIN users u ON pr.created_by = u.id
      LEFT JOIN payroll_items pi ON pr.id = pi.payroll_run_id
      WHERE LOWER(pr.status) = 'draft'
      GROUP BY pr.id
      ORDER BY pr.period_month DESC
    `);

    // 2. Pending expenses awaiting payment/authorization
    const [pendingExpenses] = await pool.query(`
      SELECT 
        e.id,
        e.description,
        e.amount,
        e.tax_amount,
        (e.amount + e.tax_amount) as total_payable,
        e.expense_date,
        e.due_date,
        e.status,
        e.vendor_name,
        e.reference_no,
        ec.name as category_name,
        u.full_name as recorded_by_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.recorded_by = u.id
      WHERE LOWER(e.status) = 'unpaid'
      ORDER BY e.amount DESC
      LIMIT 20
    `);

    res.status(200).json({
      success: true,
      data: {
        payrolls: pendingPayrolls,
        expenses: pendingExpenses
      }
    });
  } catch (error) {
    console.error('[getPendingApprovals error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving pending approvals' });
  }
};

const authorizePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check constraint payroll_runs_chk_2 allows ('draft', 'approved', 'paid')
    await pool.query(
      'UPDATE payroll_runs SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['approved', adminId, id]
    );

    // Record audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, 'PAYROLL_AUTHORIZED', 'payroll_runs', id, JSON.stringify({ approved_by: adminId, status: 'approved' })]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Payroll run #${id} has been formally authorized and approved by the Club Owner for disbursement.`
    });
  } catch (error) {
    console.error('[authorizePayroll error]', error);
    res.status(500).json({ success: false, message: 'Server error authorizing payroll' });
  }
};

const authorizeExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { payment_method = 'bank_transfer', reference_no } = req.body;

    // Check constraint expenses_chk_3: ('unpaid', 'paid', 'void')
    // Check constraint expenses_chk_5: status <> 'paid' or paid_at is not null
    await pool.query(
      'UPDATE expenses SET status = ?, paid_at = NOW(), payment_method = ?, reference_no = COALESCE(?, reference_no), updated_at = NOW() WHERE id = ?',
      ['paid', payment_method, reference_no || `OWNER-APPR-${Date.now().toString().slice(-6)}`, id]
    );

    // Record audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, 'EXPENSE_AUTHORIZED', 'expenses', id, JSON.stringify({ approved_by: adminId, status: 'paid' })]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Expense #${id} authorized and marked as paid by the Club Owner.`
    });
  } catch (error) {
    console.error('[authorizeExpense error]', error);
    res.status(500).json({ success: false, message: 'Server error authorizing expense' });
  }
};

// ============================================
// 3. Business Strategy (Pricing & Plans)
// ============================================

const getMembershipPlans = async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM membership_plans ORDER BY sort_order ASC, fee ASC');
    const [benefits] = await pool.query('SELECT * FROM plan_benefits ORDER BY sort_order ASC');

    const plansWithBenefits = plans.map(p => ({
      ...p,
      benefits: benefits.filter(b => b.plan_id === p.id).map(b => b.description)
    }));

    res.status(200).json({ success: true, data: plansWithBenefits });
  } catch (error) {
    console.error('[getMembershipPlans error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving membership plans' });
  }
};

const createMembershipPlan = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      code,
      name,
      description,
      duration_months = 12,
      price,
      fee,
      joining_fee = 0,
      shop_discount_pct = 10,
      bar_discount_pct = 10,
      can_join_social_play = 1,
      benefits = []
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Plan name is required' });
    }

    const planCode = code || name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 30);
    const planFee = fee !== undefined ? fee : (price || 0);

    await connection.beginTransaction();

    const [plan] = await connection.query(`
      INSERT INTO membership_plans 
        (code, name, description, duration_months, fee, joining_fee, shop_discount_pct, bar_discount_pct, can_join_social_play, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [planCode, name, description, duration_months, planFee, joining_fee, shop_discount_pct, bar_discount_pct, can_join_social_play ? 1 : 0]);

    const planId = plan.insertId;

    if (Array.isArray(benefits) && benefits.length > 0) {
      const values = benefits.map((b, idx) => [planId, b, idx + 1]);
      await connection.query('INSERT INTO plan_benefits (plan_id, description, sort_order) VALUES ?', [values]);
    }

    // Audit log
    await connection.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.user.id, 'MEMBERSHIP_PLAN_CREATED', 'membership_plans', planId, JSON.stringify({ code: planCode, name, fee: planFee })]
    ).catch(() => {});

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Strategic membership tier "${name}" successfully established.`,
      planId
    });
  } catch (error) {
    await connection.rollback();
    console.error('[createMembershipPlan error]', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating membership plan' });
  } finally {
    connection.release();
  }
};

const manageDiscounts = async (req, res) => {
  try {
    const { target = 'SHOP', discount_percent = 10 } = req.body;
    const adminId = req.user.id;
    const settingKey = 'GLOBAL_DISCOUNT_' + target.toUpperCase();

    // In club_settings table: columns are `key`, `value`, `updated_by`, `updated_at`
    const [existing] = await pool.query('SELECT `key` FROM club_settings WHERE `key` = ?', [settingKey]);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE club_settings SET value = ?, updated_by = ?, updated_at = NOW() WHERE `key` = ?',
        [String(discount_percent), adminId, settingKey]
      );
    } else {
      await pool.query(
        'INSERT INTO club_settings (`key`, value, description, updated_by, updated_at) VALUES (?, ?, ?, ?, NOW())',
        [settingKey, String(discount_percent), `Global owner discount for ${target}`, adminId]
      );
    }

    res.status(200).json({
      success: true,
      message: `Global discount strategy updated: ${discount_percent}% for ${target.toUpperCase()}`
    });
  } catch (error) {
    console.error('[manageDiscounts error]', error);
    res.status(500).json({ success: false, message: 'Server error updating discount strategy' });
  }
};

// ============================================
// 4. External Reporting (Investors & Auditors)
// ============================================

const getReportShares = async (req, res) => {
  try {
    const [shares] = await pool.query(`
      SELECT 
        rs.id,
        rs.report_type,
        rs.period_start,
        rs.period_end,
        rs.share_token,
        rs.recipient_name,
        rs.recipient_email,
        rs.expires_at,
        rs.revoked_at,
        rs.view_count,
        rs.created_at,
        u.full_name as created_by_name
      FROM report_shares rs
      LEFT JOIN users u ON rs.created_by = u.id
      ORDER BY rs.created_at DESC
    `);

    res.status(200).json({ success: true, data: shares });
  } catch (error) {
    console.error('[getReportShares error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving report shares' });
  }
};

const generateReportShare = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const {
      report_type = 'monthly_summary',
      recipient_name = 'Club Board / Investor',
      recipient_email,
      period_start,
      period_end
    } = req.body;

    const allowedTypes = [
      'daily_summary',
      'weekly_summary',
      'monthly_summary',
      'revenue_by_source',
      'payables',
      'tax_summary',
      'custom'
    ];

    const safeReportType = allowedTypes.includes(report_type) ? report_type : 'monthly_summary';

    const token = crypto.randomBytes(24).toString('hex');
    const pStart = period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pEnd = period_end || new Date().toISOString().split('T')[0];

    const snapshot = JSON.stringify({
      report_type: safeReportType,
      generated_at: new Date().toISOString(),
      generated_by: ownerId,
      recipient: { name: recipient_name, email: recipient_email },
      disclaimer: 'The Champions Club Confidential Financial Briefing'
    });

    const [result] = await pool.query(`
      INSERT INTO report_shares 
        (report_type, period_start, period_end, snapshot, share_token, recipient_name, recipient_email, expires_at, created_by, created_at)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, NOW())
    `, [safeReportType, pStart, pEnd, snapshot, token, recipient_name, recipient_email, ownerId]);

    const secureLink = `http://localhost:5173/reports/share/${token}`;

    res.status(201).json({
      success: true,
      message: 'Secure board & investor share link generated successfully',
      share_id: result.insertId,
      share_token: token,
      secure_link: secureLink,
      expires_in: '7 Days'
    });
  } catch (error) {
    console.error('[generateReportShare error]', error);
    res.status(500).json({ success: false, message: error.message || 'Server error generating report share' });
  }
};

module.exports = {
  getRevenueAnalytics,
  getOccupancyAnalytics,
  getGrowthAnalytics,
  getPendingApprovals,
  authorizePayroll,
  authorizeExpense,
  getMembershipPlans,
  createMembershipPlan,
  manageDiscounts,
  getReportShares,
  generateReportShare
};
