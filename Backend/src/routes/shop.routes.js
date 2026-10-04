const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const {
  getCatalog,
  getVariantBySku,
  processInStoreSale,
  getPendingPickups,
  fulfillOrder,
  processReturn,
  getStats
} = require('../controllers/shop.controller');

const router = express.Router();

// Require auth and Gear Shop Staff / Manager / Owner role
router.use(requireAuth);
router.use(requireRole('SHOP_STAFF', 'GEAR_BOX_STAFF', 'MANAGER', 'OWNER'));

// 1. Dashboard & Stats
router.get('/stats', getStats);

// 2. Catalog & Barcode Scanner / SKU Lookup
router.get('/catalog', getCatalog);
router.get('/variants/sku/:sku', getVariantBySku);

// 3. In-Store POS Checkout
router.post('/orders', processInStoreSale);

// 4. Online Order Fulfillment (Click & Collect)
router.get('/orders/pending-pickup', getPendingPickups);
router.patch('/orders/:id/fulfill', fulfillOrder);

// 5. Returns & Exchanges
router.post('/orders/:id/return', processReturn);

module.exports = router;
