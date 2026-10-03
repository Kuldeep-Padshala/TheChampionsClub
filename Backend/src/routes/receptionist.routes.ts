import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import * as receptionist from '../controllers/receptionist.controller';

const router = Router();

// ─── Enforce Auth & FRONT_DESK Role on All Receptionist Routes ───
router.use(requireAuth);
router.use(requireRole('FRONT_DESK'));

// 1. Member Management
router.get('/members', receptionist.getMembers);
router.post('/members', receptionist.registerMember);
router.get('/members/:id', receptionist.getMemberById);
router.post('/memberships', receptionist.sellMembership);

// 2. Check-In System (QR / Barcode / Manual with status alerts)
router.post('/check-ins', receptionist.checkIn);

// 3. Court Calendar & Booking Engine
router.get('/courts/availability', receptionist.getCourtAvailability);
router.post('/bookings', receptionist.createBooking);
router.post('/bookings/:id/cancel', receptionist.cancelBooking);

// 4. Billing & POS
router.get('/invoices', receptionist.getInvoices);
router.post('/invoices', receptionist.createInvoice);
router.post('/payments', receptionist.recordPayment);

// 5. Enquiries & Lead Management
router.get('/enquiries', receptionist.getEnquiries);
router.post('/enquiries', receptionist.createEnquiry);
router.patch('/enquiries/:id', receptionist.updateEnquiry);

// 6. Helper Dropdowns
router.get('/sports', receptionist.getSports);
router.get('/membership-plans', receptionist.getMembershipPlans);

export default router;
