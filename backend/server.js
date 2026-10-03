import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import pool from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Endpoint 1: Create Order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const amount = 5000; // ₹50 in paise
    const currency = 'INR';
    const productName = 'Cricket Leather Ball';

    const options = {
      amount,
      currency,
      receipt: `receipt_ball_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    // Insert into database
    await pool.query(
      `INSERT INTO orders (razorpay_order_id, product_name, amount, currency, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [order.id, productName, amount, currency, 'created']
    );

    res.json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Endpoint 2: Verify Payment
app.post('/api/payment/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update database status to paid
      await pool.query(
        `UPDATE orders 
         SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ? 
         WHERE razorpay_order_id = ?`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id]
      );
      
      res.json({ success: true, message: 'Payment successfully verified' });
    } else {
      // Update database status to failed
      await pool.query(
        `UPDATE orders SET status = 'failed' WHERE razorpay_order_id = ?`,
        [razorpay_order_id]
      );
      
      res.status(400).json({ success: false, message: 'Invalid Signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
