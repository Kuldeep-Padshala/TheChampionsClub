const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const {
  getRevenueAnalytics,
  getOccupancyAnalytics,
  getGrowthAnalytics,
  authorizePayroll,
  authorizeExpense,
  createMembershipPlan,
  manageDiscounts,
  generateReportShare
} = require('../controllers/owner.controller');

const router = express.Router();

// Require auth and OWNER role
router.use(requireAuth);
router.use(requireRole('OWNER'));

// 1. Executive Dashboard
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/occupancy', getOccupancyAnalytics);
router.get('/analytics/growth', getGrowthAnalytics);

// 2. Financial Approvals
router.patch('/payroll/:id/approve', authorizePayroll);
router.patch('/expenses/:id/approve', authorizeExpense);

// 3. Business Strategy
router.post('/membership-plans', createMembershipPlan);
router.patch('/discounts', manageDiscounts);

// 4. External Reporting
router.post('/reports/share', generateReportShare);

module.exports = router;
