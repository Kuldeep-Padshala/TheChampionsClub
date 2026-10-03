import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { 
  getMe, 
  updateMe, 
  getMyBookings, 
  createMyBooking, 
  cancelMyBooking,
  getMyInvoices,
  initOnlinePayment,
  getProducts,
  getMyOrders,
  placeMyOrder
} from '../controllers/member.controller';
import { getCourtAvailability } from '../controllers/receptionistController'; // reusing logic

const router = Router();

// ============================================
// 1. Authentication & Profile
// ============================================
// Note: /api/auth/login is usually in an auth.routes.ts file which connects to auth.service.ts
// The routes below require the user to be authenticated
router.use(requireAuth);

// Members must have the MEMBER role
router.use(requireRole('MEMBER'));

router.get('/me', getMe);
router.patch('/me', updateMe);

// ============================================
// 2. Court Calendar & Bookings
// ============================================
// We can use the same getCourtAvailability logic from receptionist (ensure it's exported in TS/JS properly)
router.get('/courts/availability', getCourtAvailability);
router.get('/bookings/me', getMyBookings);
router.post('/bookings/me', createMyBooking);
router.post('/bookings/me/:id/cancel', cancelMyBooking);

// ============================================
// 3. Billing & Online Payments
// ============================================
router.get('/invoices/me', getMyInvoices);
router.post('/payments/me/online', initOnlinePayment);

// ============================================
// 4. Shop & E-Commerce
// ============================================
router.get('/shop/products', getProducts);
router.post('/shop/orders/me', placeMyOrder);
router.get('/shop/orders/me', getMyOrders);

export default router;
