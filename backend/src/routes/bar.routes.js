const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const {
  getMenu,
  getTables,
  getOpenTabs,
  openTab,
  closeTab,
  createOrder,
  getActiveOrders,
  updateOrderItemStatus,
  quickPayOrder
} = require('../controllers/bar.controller');

const router = express.Router();

// Require auth and Bar Cafe Staff role (or Manager/Owner fallback defined in auth.middleware)
router.use(requireAuth);
router.use(requireRole('BAR_CAFE_STAFF'));

// 1. POS Setup
router.get('/menu', getMenu);
router.get('/tables', getTables);

// 2. Tab Management
router.get('/tabs', getOpenTabs);
router.post('/tabs', openTab);
router.post('/tabs/:id/close', closeTab);

// 3. Order Taking (KOT)
router.post('/orders', createOrder);
router.get('/orders/active', getActiveOrders);

// 4. Kitchen / Service Tracking
router.patch('/order-items/:id/status', updateOrderItemStatus);

// 5. Quick Check-out (Walk-in)
router.post('/orders/quick-pay', quickPayOrder);

module.exports = router;
