"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const member_controller_1 = require("../controllers/member.controller");
const receptionistController_1 = require("../controllers/receptionistController"); // reusing logic
const router = (0, express_1.Router)();
// ============================================
// 1. Authentication & Profile
// ============================================
// Note: /api/auth/login is usually in an auth.routes.ts file which connects to auth.service.ts
// The routes below require the user to be authenticated
router.use(auth_middleware_1.requireAuth);
// Members must have the MEMBER role
router.use((0, auth_middleware_1.requireRole)('MEMBER'));
router.get('/me', member_controller_1.getMe);
router.patch('/me', member_controller_1.updateMe);
// ============================================
// 2. Court Calendar & Bookings
// ============================================
// We can use the same getCourtAvailability logic from receptionist (ensure it's exported in TS/JS properly)
router.get('/courts/availability', receptionistController_1.getCourtAvailability);
router.get('/bookings/me', member_controller_1.getMyBookings);
router.post('/bookings/me', member_controller_1.createMyBooking);
router.post('/bookings/me/:id/cancel', member_controller_1.cancelMyBooking);
// ============================================
// 3. Billing & Online Payments
// ============================================
router.get('/invoices/me', member_controller_1.getMyInvoices);
router.post('/payments/me/online', member_controller_1.initOnlinePayment);
// ============================================
// 4. Shop & E-Commerce
// ============================================
router.get('/shop/products', member_controller_1.getProducts);
router.post('/shop/orders/me', member_controller_1.placeMyOrder);
router.get('/shop/orders/me', member_controller_1.getMyOrders);
exports.default = router;
