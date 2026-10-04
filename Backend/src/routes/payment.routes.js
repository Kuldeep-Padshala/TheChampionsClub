const { Router } = require('express');
const { createOrder, verifyPayment } = require('../controllers/payment.controller');

const router = Router();

// Create Razorpay order
router.post('/create-order', createOrder);

// Verify Razorpay HMAC signature & complete payment
router.post('/verify-payment', verifyPayment);

module.exports = router;
