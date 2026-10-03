const express = require('express');
const router = express.Router();
const { 
  getMembers,
  registerMember,
  getMemberById,
  sellMembership,
  getCourtAvailability,
  createBooking,
  cancelBooking,
  checkIn,
  getInvoices,
  createInvoice,
  recordPayment,
  getEnquiries,
  createEnquiry,
  updateEnquiry
} = require('../controllers/receptionistController');

// ============================================
// 2. MEMBER MANAGEMENT
// ============================================
router.get('/members', getMembers);
router.post('/members', registerMember);
router.get('/members/:id', getMemberById);
router.post('/memberships', sellMembership);

// ============================================
// 3. COURT CALENDAR & BOOKINGS
// ============================================
router.get('/courts/availability', getCourtAvailability);
router.post('/bookings', createBooking);
router.post('/bookings/:id/cancel', cancelBooking);

// ============================================
// 4. CHECK-INS
// ============================================
router.post('/check-ins', checkIn);

// ============================================
// 5. BILLING & PAYMENTS
// ============================================
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.post('/payments', recordPayment);

// ============================================
// 6. ENQUIRIES & LEADS
// ============================================
router.get('/enquiries', getEnquiries);
router.post('/enquiries', createEnquiry);
router.patch('/enquiries/:id', updateEnquiry);

module.exports = router;
