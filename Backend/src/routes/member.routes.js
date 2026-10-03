const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const member = require('../controllers/member.controller');

const router = Router();

// ─── Enforce Auth & MEMBER Role on All Member Routes ───
router.use(requireAuth);
router.use(requireRole('MEMBER'));

// 1. Authentication & Profile
router.get('/me', member.getMe);
router.patch('/me', member.updateMe);

// 2. Court Calendar & Bookings
router.get('/courts/availability', member.getCourtAvailability);
router.get('/bookings/me', member.getMyBookings);
router.post('/bookings/me', member.createMyBooking);
router.post('/bookings/me/:id/cancel', member.cancelMyBooking);

// 3. Billing & Online Payments
router.get('/invoices/me', member.getMyInvoices);
router.post('/payments/me/online', member.initOnlinePayment);

// 4. Shop & E-Commerce
router.get('/shop/products', member.getProducts);
router.post('/shop/orders/me', member.placeMyOrder);
router.get('/shop/orders/me', member.getMyOrders);

module.exports = router;
