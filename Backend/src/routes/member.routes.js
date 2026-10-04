const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const member = require('../controllers/member.controller');

const router = Router();

// ─── Enforce Auth on All Member Routes ───
router.use(requireAuth);

// 1. Authentication & Profile (allows pending applicants to query their status)
router.get('/me', member.getMe);

// ─── Require approved MEMBER role for active club operations ───
router.use(requireRole('MEMBER'));

router.patch('/me', member.updateMe);
router.get('/plans', member.getMembershipPlans);
router.post('/plans/subscribe', member.subscribeMembershipPlan);
router.post('/simulate-status', member.simulateMemberStatus);

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
