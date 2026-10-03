const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const {
  recordExpense,
  payExpense,
  runPayroll,
  approvePayroll,
  getTaxSummary,
  fileTaxReturn,
  getPnLStatement
} = require('../controllers/accountant.controller');

const router = express.Router();

// Require auth and ACCOUNTANT role
router.use(requireAuth);
router.use(requireRole('ACCOUNTANT'));

// 1. Expense Tracking
router.post('/expenses', recordExpense);
router.patch('/expenses/:id/pay', payExpense);

// 2. Payroll
router.post('/payroll/run', runPayroll);
router.patch('/payroll/:id/approve', approvePayroll);

// 3. Taxes & Compliance
router.get('/taxes/summary', getTaxSummary);
router.post('/taxes/returns', fileTaxReturn);

// 4. Financial Reporting
router.get('/reports/pnl', getPnLStatement);

module.exports = router;
