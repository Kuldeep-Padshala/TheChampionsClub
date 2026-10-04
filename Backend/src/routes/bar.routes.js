const express = require('express');
const router = express.Router();
const barController = require('../controllers/bar.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// Protect all cafe & bar routes
router.use(requireAuth);
router.use(requireRole('BAR_STAFF', 'MANAGER', 'OWNER'));

// Menu & Categories
router.get('/categories', barController.getCategories);
router.get('/menu', barController.getMenu);
router.patch('/menu/:id', barController.updateMenuAvailability);

// Tables & Seating
router.get('/tables', barController.getTables);
router.patch('/tables/:id/status', barController.updateTableStatus);

// Tabs Management
router.get('/tabs', barController.getTabs);
router.post('/tabs', barController.openTab);
router.post('/tabs/:id/settle', barController.settleTab);

// Orders & KDS
router.get('/orders', barController.getOrders);
router.post('/orders', barController.createOrder);
router.patch('/orders/:id/status', barController.updateOrderStatus);
router.post('/orders/:id/cancel', barController.cancelOrder);

// POS Quick Counter Sale
router.post('/checkout', barController.directCheckout);

// Shift Stats & Overview
router.get('/stats', barController.getStats);

module.exports = router;
