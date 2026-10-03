const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const {
  getCatalog,
  getVariantBySku,
  processInStoreSale,
  getPendingPickups,
  fulfillOrder,
  processReturn
} = require('../controllers/shop.controller');

const router = express.Router();

// Require auth and Gear Box Staff role
router.use(requireAuth);
router.use(requireRole('GEAR_BOX_STAFF'));

// 1. Catalog & Barcode
router.get('/catalog', getCatalog);
router.get('/variants/sku/:sku', getVariantBySku);

// 2. In-Store Checkout
router.post('/orders', processInStoreSale);

// 3. Online Order Fulfillment
router.get('/orders/pending-pickup', getPendingPickups);
router.patch('/orders/:id/fulfill', fulfillOrder);

// 4. Returns & Exchanges
router.post('/orders/:id/return', processReturn);

module.exports = router;
