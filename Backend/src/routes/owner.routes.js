const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const {
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
} = require('../controllers/owner.controller');

const router = express.Router();

// Require auth and OWNER role
router.use(requireAuth);
router.use(requireRole('OWNER'));

// 1. Executive Dashboard (Analytics & Health)
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/occupancy', getOccupancyAnalytics);
router.get('/analytics/growth', getGrowthAnalytics);

// 2. Financial Approvals (Pending & Actions)
router.get('/approvals/pending', getPendingApprovals);
router.patch('/payroll/:id/approve', authorizePayroll);
router.patch('/expenses/:id/approve', authorizeExpense);

// 3. Business Strategy (Pricing & Plans)
router.get('/membership-plans', getMembershipPlans);
router.post('/membership-plans', createMembershipPlan);
router.patch('/discounts', manageDiscounts);

// 4. External Reporting (Investors & Auditors)
router.get('/reports/shares', getReportShares);
router.post('/reports/share', generateReportShare);

module.exports = router;
