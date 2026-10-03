const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const manager = require('../controllers/manager.controller');

const router = Router();

// Enforce Authentication and MANAGER (or OWNER) role on all routes
router.use(requireAuth);
router.use(requireRole('MANAGER'));

// ============================================
// 1. Operations & Configuration
// ============================================
router.get('/courts', manager.getCourts);
router.patch('/courts/:id', manager.updateCourt);
router.get('/court-rates', manager.getCourtRates);
router.patch('/court-rates/:id', manager.updateCourtRate);
router.get('/inventory', manager.getInventory);
router.post('/inventory/adjust', manager.adjustInventory);
router.get('/inventory/movements', manager.getStockMovements);
router.get('/bar/menu', manager.getBarMenu);
router.patch('/bar/menu/:id', manager.updateBarMenu);

// ============================================
// 2. Overrides & Corrections ("The Boss Actions")
// ============================================
router.post('/bookings/override', manager.forceBookCourt);
router.get('/invoices', manager.getInvoices);
router.post('/invoices/:id/void', manager.voidInvoice);

// ============================================
// 3. Staff & Shift Management (HR)
// ============================================
router.get('/employees', manager.getEmployees);
router.get('/shifts', manager.getShifts);
router.post('/shifts', manager.createShift);
router.get('/leaves', manager.getLeaves);
router.get('/leave-types', manager.getLeaveTypes);
router.patch('/leaves/:id/approve', manager.approveLeave);

// ============================================
// 4. Financial Reporting & End-of-Day
// ============================================
router.get('/reports/daily-summary', manager.getDailySummary);
router.get('/daily-closings', manager.getDailyClosings);
router.post('/daily-closings', manager.closeRegister);

module.exports = router;
