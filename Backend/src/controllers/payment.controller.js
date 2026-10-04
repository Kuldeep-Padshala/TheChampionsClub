const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { env } = require('../config/env');
const { createAndSendNotification, sendToRole } = require('../services/websocket.service');

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

/**
 * 1. Create a Razorpay Order
 * POST /api/payment/create-order
 */
async function createOrder(req, res) {
  try {
    const { amount, currency = 'INR', productName = 'Club Sanctuary Bill', invoice_id = null } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    // Convert rupees to paise (e.g. ₹50 -> 5000 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    const order = await razorpay.orders.create(options);

    // Save into orders table
    await pool.query(
      `INSERT INTO orders (razorpay_order_id, product_name, amount, currency, status, invoice_id, user_id) 
       VALUES (?, ?, ?, ?, 'created', ?, ?)`,
      [order.id, productName, amountInPaise, currency, invoice_id, userId]
    );

    res.json({
      success: true,
      order,
      key_id: env.razorpay.keyId,
    });
  } catch (error) {
    console.error('[createOrder error]', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating Razorpay order' });
  }
}

/**
 * 2. Verify Razorpay Payment Signature
 * POST /api/payment/verify-payment
 */
async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

  try {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification credentials' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // 1. Update orders table to 'paid'
      await pool.query(
        `UPDATE orders 
         SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ? 
         WHERE razorpay_order_id = ?`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id]
      );

      // 2. Fetch order details to see if linked to an invoice
      const [orderRows] = await pool.query(
        'SELECT * FROM orders WHERE razorpay_order_id = ? LIMIT 1',
        [razorpay_order_id]
      );
      const order = orderRows[0];
      const targetInvoiceId = invoice_id || order?.invoice_id;

      // 3. If linked to an invoice, record in payments table and update invoice
      if (targetInvoiceId) {
        const payAmount = order ? order.amount / 100 : 0;
        const receiptNo = 'REC-RZP-' + Date.now();

        await pool.query(
          `INSERT INTO payments (receipt_no, invoice_id, amount, method, status, notes, paid_at, created_at) 
           VALUES (?, ?, ?, 'online_razorpay', 'success', ?, NOW(), NOW())`,
          [receiptNo, targetInvoiceId, payAmount, `Razorpay Payment ID: ${razorpay_payment_id}`]
        );

        await pool.query(
          `UPDATE invoices 
           SET amount_paid = COALESCE(amount_paid, 0) + ?, balance_due = GREATEST(0, balance_due - ?) 
           WHERE id = ?`,
          [payAmount, payAmount, targetInvoiceId]
        );

        const [invRows] = await pool.query('SELECT balance_due, invoice_no FROM invoices WHERE id = ?', [targetInvoiceId]);
        if (invRows.length > 0 && Number(invRows[0].balance_due) <= 0) {
          await pool.query(`UPDATE invoices SET status = 'paid', balance_due = 0 WHERE id = ?`, [targetInvoiceId]);
        }
      }

      const totalPaid = order ? order.amount / 100 : 0;

      // 4. Send real-time notification to paying user if linked
      if (order?.user_id) {
        createAndSendNotification({
          recipient_user_id: order.user_id,
          title: 'Payment Confirmed',
          body: `Payment of ₹${totalPaid.toLocaleString('en-IN')} successfully verified via Razorpay (ID: ${razorpay_payment_id}).`,
          type: 'payment',
          entity_type: 'order',
          entity_id: order.id,
        }).catch(err => console.error('[Notif payment error]', err.message));
      }

      // 5. Notify Accountant & Management
      sendToRole('ACCOUNTANT', {
        type: 'NOTIFICATION',
        notification: {
          title: 'Online Payment Verified',
          body: `Payment ₹${totalPaid.toLocaleString('en-IN')} verified via Razorpay (${razorpay_payment_id}).`,
          type: 'payment',
          created_at: new Date().toISOString(),
        },
      });

      res.json({
        success: true,
        message: 'Payment successfully verified!',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      await pool.query(
        `UPDATE orders SET status = 'failed' WHERE razorpay_order_id = ?`,
        [razorpay_order_id]
      );
      res.status(400).json({ success: false, message: 'Invalid Razorpay Signature' });
    }
  } catch (error) {
    console.error('[verifyPayment error]', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
}

module.exports = {
  createOrder,
  verifyPayment,
};
