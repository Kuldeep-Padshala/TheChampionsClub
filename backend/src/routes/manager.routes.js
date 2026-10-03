const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const {
  updateCourt,
  updateCourtRate,
  adjustInventory,
  updateBarMenu,
  forceBookCourt,
  voidInvoice,
  getEmployees,
  createShift,
  approveLeave,
  closeRegister,
  getDailySummary
} = require('../controllers/manager.controller');

const router = express.Router();

// All manager routes require Auth and MANAGER role
router.use(requireAuth);
router.use(requireRole('MANAGER'));

// ============================================
// 1. Operations & Configuration
// ============================================
router.patch('/courts/:id', updateCourt);
router.patch('/court-rates/:id', updateCourtRate);
router.post('/inventory/adjust', adjustInventory);
router.patch('/bar/menu/:id', updateBarMenu);

// ============================================
// 2. Overrides & Corrections (The Boss Actions)
// ============================================
router.post('/bookings/override', forceBookCourt);
router.post('/invoices/:id/void', voidInvoice);

// ============================================
// 3. Staff & Shift Management (HR)
// ============================================
router.get('/employees', getEmployees);
router.post('/shifts', createShift);
router.patch('/leaves/:id/approve', approveLeave);

// ============================================
// 4. Financial Reporting & End-of-Day
// ============================================
router.post('/daily-closings', closeRegister);
router.get('/reports/daily-summary', getDailySummary);

module.exports = router;
