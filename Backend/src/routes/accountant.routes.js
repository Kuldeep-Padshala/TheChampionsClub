const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const {
  getExpenses,
  getExpenseCategories,
  getSuppliers,
  recordExpense,
  payExpense,
  getPayrollRuns,
  getPayrollItems,
  runPayroll,
  approvePayroll,
  getTaxSummary,
  getTaxReturns,
  fileTaxReturn,
  getPnLStatement,
  getStats
} = require('../controllers/accountant.controller');

const router = express.Router();

// Require auth and ACCOUNTANT / MANAGER / OWNER role
router.use(requireAuth);
router.use(requireRole('ACCOUNTANT', 'MANAGER', 'OWNER'));

// 0. Dashboard Stats
router.get('/stats', getStats);

// 1. Expense Tracking
router.get('/expenses', getExpenses);
router.get('/expense-categories', getExpenseCategories);
router.get('/suppliers', getSuppliers);
router.post('/expenses', recordExpense);
router.patch('/expenses/:id/pay', payExpense);

// 2. Payroll
router.get('/payroll/runs', getPayrollRuns);
router.get('/payroll/runs/:id/items', getPayrollItems);
router.post('/payroll/run', runPayroll);
router.patch('/payroll/runs/:id/approve', approvePayroll);

// 3. Taxes & Compliance
router.get('/taxes/summary', getTaxSummary);
router.get('/taxes/returns', getTaxReturns);
router.post('/taxes/returns', fileTaxReturn);

// 4. Financial Reporting
router.get('/reports/pnl', getPnLStatement);

module.exports = router;
