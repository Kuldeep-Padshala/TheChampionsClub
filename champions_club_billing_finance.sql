-- =====================================================================
--  Champions Club : Billing & Finance data (MySQL 8.0+)
--  Tables : invoices, invoice_items, payments, refunds
--  Contents: dummy data + check queries  (no CREATE TABLE statements)
--  Reference date: Saturday 3 Oct 2026
-- =====================================================================

USE champions_club;

-- ---------------------------------------------------------------------
-- OPTIONAL RESET (practice databases only — order matters for FKs)
-- ---------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS refunds, payments, invoice_items, invoices;
-- SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- DUMMY DATA
-- ==== DATA START ====
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1  invoices  (15 rows)
--      Invoices 1-9  : membership sign-up invoices (all paid same day)
--      Invoices 10-12: member court-booking batch invoices (Silver members pay per session)
--      Invoices 13-14: walk-in guest single-session invoices
--      Invoice 15    : corporate monthly invoice for TechSoft Solutions (status='issued', not yet due)
--      Tax rate: GST 18% (tax_rate_id = 4) applied to all lines.
--      Gold members pay ₹0 per court — no court invoice generated for them.
--      bill_to_name is a SNAPSHOT of the customer name at invoice time.
--      issued_by: 2=Sunita(Manager)  4=Priya(FD)  5=Rohan(FD)
-- ---------------------------------------------------------------------
INSERT INTO invoices
  (id, invoice_no,
   member_id, guest_id, business_client_id,
   bill_to_name, quote_id,
   status, issue_date, due_date,
   subtotal, discount_total, tax_total, total_amount,
   amount_paid, balance_due,
   notes, issued_by,
   voided_at, voided_by, void_reason,
   created_at, updated_at)
VALUES
-- ============================================================
-- Membership invoices  (fee + joining fee, GST 18%)
-- ============================================================
-- Gold: subtotal 9,998  tax 1,799.64  total 11,797.64
( 1, 'INV-2026-0001', 1, NULL, NULL, 'Ravi Shankar',      NULL, 'paid',    '2026-03-22', '2026-03-22',  9998.00, 0.00, 1799.64, 11797.64, 11797.64, 0.00, 'Thank you for joining The Champions Club!', 2, NULL, NULL, NULL, '2026-03-22 18:05:00', '2026-03-22 18:25:00'),
-- Silver: subtotal 4,998  tax 899.64  total 5,897.64
( 2, 'INV-2026-0002', 2, NULL, NULL, 'Rahul Bose',        NULL, 'paid',    '2026-07-20', '2026-07-20',  4998.00, 0.00,  899.64,  5897.64,  5897.64, 0.00, 'Thank you for joining The Champions Club!', 4, NULL, NULL, NULL, '2026-07-20 10:10:00', '2026-07-20 10:30:00'),
( 3, 'INV-2026-0003', 3, NULL, NULL, 'Ananya Singh',      NULL, 'paid',    '2026-09-03', '2026-09-03',  4998.00, 0.00,  899.64,  5897.64,  5897.64, 0.00, 'Thank you for joining The Champions Club!', 4, NULL, NULL, NULL, '2026-09-03 17:25:00', '2026-09-03 17:45:00'),
-- Gold
( 4, 'INV-2026-0004', 4, NULL, NULL, 'Vihaan Reddy',      NULL, 'paid',    '2026-09-05', '2026-09-05',  9998.00, 0.00, 1799.64, 11797.64, 11797.64, 0.00, 'Thank you for joining The Champions Club!', 4, NULL, NULL, NULL, '2026-09-05 11:05:00', '2026-09-05 11:25:00'),
-- Silver
( 5, 'INV-2026-0005', 5, NULL, NULL, 'Ishita Menon',      NULL, 'paid',    '2026-09-08', '2026-09-08',  4998.00, 0.00,  899.64,  5897.64,  5897.64, 0.00, 'Thank you for joining The Champions Club!', 5, NULL, NULL, NULL, '2026-09-08 18:40:00', '2026-09-08 19:00:00'),
-- Gold
( 6, 'INV-2026-0006', 6, NULL, NULL, 'Kabir Khanna',      NULL, 'paid',    '2026-09-12', '2026-09-12',  9998.00, 0.00, 1799.64, 11797.64, 11797.64, 0.00, 'Thank you for joining The Champions Club!', 4, NULL, NULL, NULL, '2026-09-12 09:25:00', '2026-09-12 09:45:00'),
-- Junior: subtotal 2,998  tax 539.64  total 3,537.64
( 7, 'INV-2026-0007', 7, NULL, NULL, 'Saanvi Desai',      NULL, 'paid',    '2026-09-15', '2026-09-15',  2998.00, 0.00,  539.64,  3537.64,  3537.64, 0.00, 'Thank you for joining The Champions Club! Guardian consent form filed under ref JR-2026-007.', 4, NULL, NULL, NULL, '2026-09-15 20:05:00', '2026-09-15 20:25:00'),
-- Silver
( 8, 'INV-2026-0008', 8, NULL, NULL, 'Tanvi Pillai',      NULL, 'paid',    '2026-09-22', '2026-09-22',  4998.00, 0.00,  899.64,  5897.64,  5897.64, 0.00, 'Thank you for joining The Champions Club!', 5, NULL, NULL, NULL, '2026-09-22 16:55:00', '2026-09-22 17:15:00'),
-- Gold
( 9, 'INV-2026-0009', 9, NULL, NULL, 'Arnav Kapoor',      NULL, 'paid',    '2026-09-30', '2026-09-30',  9998.00, 0.00, 1799.64, 11797.64, 11797.64, 0.00, 'Thank you for joining The Champions Club!', 4, NULL, NULL, NULL, '2026-09-30 19:15:00', '2026-09-30 19:35:00'),

-- ============================================================
-- Court-booking invoices  (Silver members; Gold = ₹0 = no invoice)
-- ============================================================
-- Ananya: 3 paid court sessions 1-3 Oct (batched; partial refund on Oct 1 session issued separately)
(10, 'INV-2026-0010', 3, NULL, NULL, 'Ananya Singh',      NULL, 'paid',    '2026-10-03', '2026-10-03',   650.00, 0.00,  117.00,   767.00,   767.00, 0.00, 'Court sessions: Badminton 1 Oct, Social 2 Oct, Tennis 3 Oct. Partial refund RC-2026-0010 issued for Oct 1 floodlight failure.', 4, NULL, NULL, NULL, '2026-10-03 16:00:00', '2026-10-03 16:30:00'),
-- Tanvi: 2 paid court sessions Oct 2-3 (batched)
(11, 'INV-2026-0011', 8, NULL, NULL, 'Tanvi Pillai',      NULL, 'paid',    '2026-10-03', '2026-10-03',   300.00, 0.00,   54.00,   354.00,   354.00, 0.00, 'Court sessions: Social Badminton 2 Oct, Badminton Court 1 3 Oct.', 5, NULL, NULL, NULL, '2026-10-03 14:00:00', '2026-10-03 14:20:00'),
-- Ishita: social play Oct 2 only
(12, 'INV-2026-0012', 5, NULL, NULL, 'Ishita Menon',      NULL, 'paid',    '2026-10-02', '2026-10-02',   100.00, 0.00,   18.00,   118.00,   118.00, 0.00, 'Friday Night Social Badminton — 2 Oct 2026.', 5, NULL, NULL, NULL, '2026-10-02 20:45:00', '2026-10-02 21:00:00'),

-- ============================================================
-- Walk-in guest invoices
-- ============================================================
-- Karan Malhotra (guest 2): Padel Court 4, 19:00-20:00 peak walk-in ₹1,200
(13, 'INV-2026-0013', NULL, 2, NULL, 'Karan Malhotra',    NULL, 'paid',    '2026-10-01', '2026-10-01',  1200.00, 0.00,  216.00,  1416.00,  1416.00, 0.00, 'Walk-in padel session 1 Oct 2026, peak rate. Partial refund RF-2026-0002 issued for early session end.', 5, NULL, NULL, NULL, '2026-10-01 19:05:00', '2026-10-01 20:05:00'),
-- Preethi Suresh (guest 1): Tennis Court 2, 10:00-11:00 off-peak walk-in ₹600
(14, 'INV-2026-0014', NULL, 1, NULL, 'Preethi Suresh',    NULL, 'paid',    '2026-10-03', '2026-10-03',   600.00, 0.00,  108.00,   708.00,   708.00, 0.00, 'Walk-in tennis session 3 Oct 2026. Follow up re: Silver membership interest.', 4, NULL, NULL, NULL, '2026-10-03 10:05:00', '2026-10-03 10:25:00'),

-- ============================================================
-- Corporate invoice: TechSoft Solutions — Sep 2026 monthly court hire
-- 15 sessions × ₹600/hr walk-in rate  (payment terms 15 days; due 16 Oct)
-- ============================================================
(15, 'INV-2026-0015', NULL, NULL, 1, 'TechSoft Solutions Pvt Ltd', NULL, 'issued', '2026-10-01', '2026-10-16', 9000.00, 0.00, 1620.00, 10620.00, 0.00, 10620.00, 'Monthly corporate court hire — September 2026 (15 sessions, mixed Tennis/Padel). GSTIN: 27AADCT5678G1ZX. Payment due 16 Oct 2026.', 2, NULL, NULL, NULL, '2026-10-01 10:00:00', '2026-10-01 10:00:00');

-- ---------------------------------------------------------------------
-- 2.2  invoice_items  (27 rows)
--      source: 'membership' | 'court_booking' | 'manual'
--      Snapshots: description, unit_price and tax are copied at invoice
--      time so that future plan price changes do not alter history.
--      tax_rate_id = 4 (GST 18%) on all lines.
--      membership_id and booking_id: only the applicable one is filled.
-- ---------------------------------------------------------------------
INSERT INTO invoice_items
  (id, invoice_id, source, description,
   quantity, unit_price, discount_amount,
   tax_rate_id, tax_amount, line_total,
   membership_id, booking_id, shop_order_id, bar_order_id)
VALUES
-- ---- Invoice 1: Ravi Shankar — Gold Membership ----
( 1,  1, 'membership', 'Gold Membership (12 months) — 22 Mar 2026 to 21 Mar 2027',
  1.00, 7999.00, 0.00, 4, 1439.82,  9438.82, 1, NULL, NULL, NULL),
( 2,  1, 'membership', 'Gold Membership — Joining Fee (one-time)',
  1.00, 1999.00, 0.00, 4,  359.82,  2358.82, 1, NULL, NULL, NULL),

-- ---- Invoice 2: Rahul Bose — Silver Membership ----
( 3,  2, 'membership', 'Silver Membership (6 months) — 20 Jul 2026 to 19 Jan 2027',
  1.00, 3999.00, 0.00, 4,  719.82,  4718.82, 5, NULL, NULL, NULL),
( 4,  2, 'membership', 'Silver Membership — Joining Fee (one-time)',
  1.00,  999.00, 0.00, 4,  179.82,  1178.82, 5, NULL, NULL, NULL),

-- ---- Invoice 3: Ananya Singh — Silver Membership ----
( 5,  3, 'membership', 'Silver Membership (6 months) — 3 Sep 2026 to 2 Mar 2027',
  1.00, 3999.00, 0.00, 4,  719.82,  4718.82, 6, NULL, NULL, NULL),
( 6,  3, 'membership', 'Silver Membership — Joining Fee (one-time)',
  1.00,  999.00, 0.00, 4,  179.82,  1178.82, 6, NULL, NULL, NULL),

-- ---- Invoice 4: Vihaan Reddy — Gold Membership ----
( 7,  4, 'membership', 'Gold Membership (12 months) — 5 Sep 2026 to 4 Sep 2027',
  1.00, 7999.00, 0.00, 4, 1439.82,  9438.82, 2, NULL, NULL, NULL),
( 8,  4, 'membership', 'Gold Membership — Joining Fee (one-time)',
  1.00, 1999.00, 0.00, 4,  359.82,  2358.82, 2, NULL, NULL, NULL),

-- ---- Invoice 5: Ishita Menon — Silver Membership ----
( 9,  5, 'membership', 'Silver Membership (6 months) — 8 Sep 2026 to 7 Mar 2027',
  1.00, 3999.00, 0.00, 4,  719.82,  4718.82, 7, NULL, NULL, NULL),
(10,  5, 'membership', 'Silver Membership — Joining Fee (one-time)',
  1.00,  999.00, 0.00, 4,  179.82,  1178.82, 7, NULL, NULL, NULL),

-- ---- Invoice 6: Kabir Khanna — Gold Membership ----
(11,  6, 'membership', 'Gold Membership (12 months) — 12 Sep 2026 to 11 Sep 2027',
  1.00, 7999.00, 0.00, 4, 1439.82,  9438.82, 3, NULL, NULL, NULL),
(12,  6, 'membership', 'Gold Membership — Joining Fee (one-time)',
  1.00, 1999.00, 0.00, 4,  359.82,  2358.82, 3, NULL, NULL, NULL),

-- ---- Invoice 7: Saanvi Desai — Junior Membership ----
(13,  7, 'membership', 'Junior Membership (12 months) — 15 Sep 2026 to 14 Sep 2027',
  1.00, 2499.00, 0.00, 4,  449.82,  2948.82, 9, NULL, NULL, NULL),
(14,  7, 'membership', 'Junior Membership — Joining Fee (one-time)',
  1.00,  499.00, 0.00, 4,   89.82,   588.82, 9, NULL, NULL, NULL),

-- ---- Invoice 8: Tanvi Pillai — Silver Membership ----
(15,  8, 'membership', 'Silver Membership (6 months) — 22 Sep 2026 to 21 Mar 2027',
  1.00, 3999.00, 0.00, 4,  719.82,  4718.82, 8, NULL, NULL, NULL),
(16,  8, 'membership', 'Silver Membership — Joining Fee (one-time)',
  1.00,  999.00, 0.00, 4,  179.82,  1178.82, 8, NULL, NULL, NULL),

-- ---- Invoice 9: Arnav Kapoor — Gold Membership ----
(17,  9, 'membership', 'Gold Membership (12 months) — 30 Sep 2026 to 29 Sep 2027',
  1.00, 7999.00, 0.00, 4, 1439.82,  9438.82, 4, NULL, NULL, NULL),
(18,  9, 'membership', 'Gold Membership — Joining Fee (one-time)',
  1.00, 1999.00, 0.00, 4,  359.82,  2358.82, 4, NULL, NULL, NULL),

-- ---- Invoice 10: Ananya Singh — Court sessions 1-3 Oct ----
(19, 10, 'court_booking', 'Court Booking — Badminton Court 2, 1 Oct 2026, 10:00-11:00 IST (Silver member rate)',
  1.00,  200.00, 0.00, 4,  36.00,  236.00, NULL,  2, NULL, NULL),
(20, 10, 'court_booking', 'Court Booking — Badminton Court 1 (Social Play), 2 Oct 2026, 18:00-20:00 IST (Silver social rate)',
  1.00,  100.00, 0.00, 4,  18.00,  118.00, NULL,  7, NULL, NULL),
(21, 10, 'court_booking', 'Court Booking — Tennis Court 1, 3 Oct 2026, 09:00-10:00 IST (Silver member rate)',
  1.00,  350.00, 0.00, 4,  63.00,  413.00, NULL, 15, NULL, NULL),

-- ---- Invoice 11: Tanvi Pillai — Court sessions 2-3 Oct ----
(22, 11, 'court_booking', 'Court Booking — Badminton Court 1 (Social Play), 2 Oct 2026, 18:00-20:00 IST (Silver social rate)',
  1.00,  100.00, 0.00, 4,  18.00,  118.00, NULL,  9, NULL, NULL),
(23, 11, 'court_booking', 'Court Booking — Badminton Court 1, 3 Oct 2026, 11:00-12:00 IST (Silver member rate)',
  1.00,  200.00, 0.00, 4,  36.00,  236.00, NULL, 18, NULL, NULL),

-- ---- Invoice 12: Ishita Menon — Social play 2 Oct ----
(24, 12, 'court_booking', 'Court Booking — Badminton Court 1 (Social Play), 2 Oct 2026, 18:00-20:00 IST (Silver social rate)',
  1.00,  100.00, 0.00, 4,  18.00,  118.00, NULL,  8, NULL, NULL),

-- ---- Invoice 13: Karan Malhotra (guest) — Padel walk-in 1 Oct ----
(25, 13, 'court_booking', 'Court Booking — Padel Court 4 (Walk-in Peak Rate), 1 Oct 2026, 19:00-20:00 IST',
  1.00, 1200.00, 0.00, 4, 216.00, 1416.00, NULL,  3, NULL, NULL),

-- ---- Invoice 14: Preethi Suresh (guest) — Tennis walk-in 3 Oct ----
(26, 14, 'court_booking', 'Court Booking — Tennis Court 2 (Walk-in Rate), 3 Oct 2026, 10:00-11:00 IST',
  1.00,  600.00, 0.00, 4, 108.00,  708.00, NULL, 16, NULL, NULL),

-- ---- Invoice 15: TechSoft Solutions — Sep 2026 monthly court hire ----
(27, 15, 'manual', 'Monthly Corporate Court Hire — September 2026 (15 sessions, Tennis/Padel, walk-in rate ₹600/session)',
  15.00, 600.00, 0.00, 4, 1620.00, 10620.00, NULL, NULL, NULL, NULL);

-- ---------------------------------------------------------------------
-- 2.3  payments  (14 rows)
--      One payment per invoice for full settlement.
--      Invoice 15 (TechSoft, due 16 Oct) has no payment yet.
--      Receipt numbering: RC-2026-NNNN
--      Methods: UPI, card, cash, online (Razorpay).
--      received_by: 2=Sunita  4=Priya  5=Rohan
-- ---------------------------------------------------------------------
INSERT INTO payments
  (id, receipt_no, invoice_id, amount, method, status,
   gateway_name, transaction_ref, card_last4,
   received_by, paid_at, notes, created_at)
VALUES
-- Membership payments (invoices 1-9)
( 1, 'RC-2026-0001',  1, 11797.64, 'upi',           'success', NULL,       'UPI20260322RAVI0001', NULL,   2, '2026-03-22 18:20:00', NULL,                                         '2026-03-22 18:20:00'),
( 2, 'RC-2026-0002',  2,  5897.64, 'card',          'success', 'Razorpay', 'TXN20260720RAHUL001', '5874', 4, '2026-07-20 10:25:00', NULL,                                         '2026-07-20 10:25:00'),
( 3, 'RC-2026-0003',  3,  5897.64, 'cash',          'success', NULL,       NULL,                  NULL,   4, '2026-09-03 17:40:00', NULL,                                         '2026-09-03 17:40:00'),
( 4, 'RC-2026-0004',  4, 11797.64, 'upi',           'success', NULL,       'UPI20260905VIHN0001', NULL,   4, '2026-09-05 11:20:00', NULL,                                         '2026-09-05 11:20:00'),
( 5, 'RC-2026-0005',  5,  5897.64, 'upi',           'success', NULL,       'UPI20260908ISHT0001', NULL,   5, '2026-09-08 18:55:00', NULL,                                         '2026-09-08 18:55:00'),
( 6, 'RC-2026-0006',  6, 11797.64, 'card',          'success', 'Razorpay', 'TXN20260912KBIR0001', '1923', 4, '2026-09-12 09:40:00', NULL,                                         '2026-09-12 09:40:00'),
( 7, 'RC-2026-0007',  7,  3537.64, 'cash',          'success', NULL,       NULL,                  NULL,   4, '2026-09-15 20:20:00', 'Cash paid by guardian Nalini Desai.',        '2026-09-15 20:20:00'),
( 8, 'RC-2026-0008',  8,  5897.64, 'upi',           'success', NULL,       'UPI20260922TANV0001', NULL,   5, '2026-09-22 17:10:00', NULL,                                         '2026-09-22 17:10:00'),
( 9, 'RC-2026-0009',  9, 11797.64, 'online',        'success', 'Razorpay', 'pay_Abc123XyzArnav',  NULL,   4, '2026-09-30 19:30:00', 'Online payment via member app checkout.', '2026-09-30 19:30:00'),
-- Court-booking payments (invoices 10-12)
(10, 'RC-2026-0010', 10,   767.00, 'upi',           'success', NULL,       'UPI20261003ANA0001',  NULL,   4, '2026-10-03 16:25:00', NULL,                                         '2026-10-03 16:25:00'),
(11, 'RC-2026-0011', 11,   354.00, 'upi',           'success', NULL,       'UPI20261003TNV0001',  NULL,   5, '2026-10-03 14:15:00', NULL,                                         '2026-10-03 14:15:00'),
(12, 'RC-2026-0012', 12,   118.00, 'upi',           'success', NULL,       'UPI20261002ISH0001',  NULL,   5, '2026-10-02 20:50:00', NULL,                                         '2026-10-02 20:50:00'),
-- Walk-in guest payments (invoices 13-14)
(13, 'RC-2026-0013', 13,  1416.00, 'cash',          'success', NULL,       NULL,                  NULL,   5, '2026-10-01 19:05:00', 'Cash collected at front desk before session.', '2026-10-01 19:05:00'),
(14, 'RC-2026-0014', 14,   708.00, 'upi',           'success', NULL,       'UPI20261003PRT0001',  NULL,   4, '2026-10-03 10:20:00', NULL,                                         '2026-10-03 10:20:00');
-- Invoice 15 (TechSoft, due 16 Oct): no payment row yet.

-- ---------------------------------------------------------------------
-- 2.4  refunds  (2 rows)
--      Refund 1: Ananya — half-session credit for floodlight failure during
--                         Badminton Court 2 session, 1 Oct 2026.
--                         ₹100 court fee + ₹18 GST = ₹118 returned via UPI.
--      Refund 2: Karan Malhotra — partial refund for session cut 20 min
--                         short due to reservation-overlap admin error, 1 Oct.
--                         ≈ 1/3 session: ₹400 court fee + ₹72 GST = ₹472 cash.
--      refunded_by: 2 = Sunita Rao (Manager — all refunds require manager approval)
-- ---------------------------------------------------------------------
INSERT INTO refunds
  (id, payment_id, amount, method, reason, refunded_by, refunded_at)
VALUES
(1, 10,  118.00, 'upi',  'Floodlights on Badminton Court 2 failed at 10:30 on 1 Oct 2026, cutting the session in half. Half-session refund (₹100 court fee + ₹18 GST) approved by manager Sunita Rao. Amount returned to original UPI.',  2, '2026-10-02 11:00:00'),
(2, 13,  472.00, 'cash', 'Walk-in session on Padel Court 4 ended 20 minutes early on 1 Oct 2026 due to an admin error in the reservation system (adjacent reservation was incorrectly logged). Partial refund of one-third of the session (₹400 + ₹72 GST) approved by manager Sunita Rao. Cash returned at front desk.', 2, '2026-10-01 22:00:00');

-- ==== DATA END ====


-- =====================================================================
-- CHECK QUERIES
-- =====================================================================

-- C1  Row counts
--     Expected: invoices 15, invoice_items 27, payments 14, refunds 2
SELECT 'invoices'      AS tbl, COUNT(*) AS row_count FROM invoices
UNION ALL SELECT 'invoice_items', COUNT(*) FROM invoice_items
UNION ALL SELECT 'payments',      COUNT(*) FROM payments
UNION ALL SELECT 'refunds',       COUNT(*) FROM refunds;

-- C2  Invoice summary: invoice number, customer, type, total, paid, balance, status
SELECT i.invoice_no,
       i.bill_to_name,
       CASE
         WHEN i.member_id          IS NOT NULL THEN 'Member'
         WHEN i.guest_id           IS NOT NULL THEN 'Guest'
         WHEN i.business_client_id IS NOT NULL THEN 'Business'
       END AS customer_type,
       i.issue_date, i.due_date,
       CONCAT('₹', FORMAT(i.total_amount, 2)) AS total,
       CONCAT('₹', FORMAT(i.amount_paid,  2)) AS paid,
       CONCAT('₹', FORMAT(i.balance_due,  2)) AS balance,
       i.status
FROM invoices i
ORDER BY i.issue_date, i.id;

-- C3  Revenue breakdown by source
--     membership vs court_booking vs manual (corporate)
SELECT ii.source,
       COUNT(DISTINCT i.id)                    AS invoice_count,
       CONCAT('₹', FORMAT(SUM(ii.line_total - ii.tax_amount), 2)) AS net_revenue,
       CONCAT('₹', FORMAT(SUM(ii.tax_amount), 2))                  AS gst_collected,
       CONCAT('₹', FORMAT(SUM(ii.line_total),  2))                  AS gross_revenue
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
GROUP BY ii.source
ORDER BY SUM(ii.line_total) DESC;

-- C4  Revenue by plan tier (membership invoices only)
SELECT mp.name AS plan,
       COUNT(DISTINCT ii.invoice_id)               AS invoices,
       CONCAT('₹', FORMAT(SUM(ii.unit_price), 2))  AS subtotal_collected
FROM invoice_items ii
JOIN memberships ms      ON ms.id = ii.membership_id
JOIN membership_plans mp ON mp.id = ms.plan_id
WHERE ii.source = 'membership'
GROUP BY mp.id, mp.name
ORDER BY SUM(ii.unit_price) DESC;

-- C5  Payment method breakdown (only successful payments)
SELECT p.method,
       COUNT(*)                                     AS payment_count,
       CONCAT('₹', FORMAT(SUM(p.amount), 2))        AS total_received
FROM payments p
WHERE p.status = 'success'
GROUP BY p.method
ORDER BY SUM(p.amount) DESC;

-- C6  Outstanding invoices (balance_due > 0)
SELECT i.invoice_no, i.bill_to_name, i.due_date,
       CONCAT('₹', FORMAT(i.balance_due, 2)) AS outstanding,
       DATEDIFF(CURDATE(), i.due_date)        AS days_overdue,
       i.status
FROM invoices i
WHERE i.balance_due > 0
ORDER BY i.due_date;

-- C7  Full billing picture for Ananya Singh (member 3)
--     Shows membership invoice + court invoice + partial refund
SELECT i.invoice_no, i.issue_date, i.status,
       CONCAT('₹', FORMAT(i.total_amount, 2)) AS invoice_total,
       CONCAT('₹', FORMAT(p.amount,        2)) AS payment_received,
       p.method, p.paid_at,
       CONCAT('₹', FORMAT(COALESCE(r.amount, 0), 2)) AS refund_issued,
       r.refunded_at
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
LEFT JOIN refunds  r ON r.payment_id = p.id
WHERE i.member_id = 3
ORDER BY i.issue_date;

-- C8  Refund ledger
SELECT r.id, r.refunded_at,
       i.invoice_no,
       i.bill_to_name,
       p.method  AS originally_paid_via,
       CONCAT('₹', FORMAT(p.amount,  2)) AS original_payment,
       r.method  AS refund_via,
       CONCAT('₹', FORMAT(r.amount,  2)) AS refund_amount,
       u.full_name AS approved_by,
       LEFT(r.reason, 80) AS reason_preview
FROM refunds r
JOIN payments p ON p.id = r.payment_id
JOIN invoices i ON i.id = p.invoice_id
JOIN users    u ON u.id = r.refunded_by
ORDER BY r.refunded_at;

-- C9  Total GST collected on paid invoices (for tax return preparation)
SELECT CONCAT('₹', FORMAT(SUM(i.tax_total),   2)) AS total_gst_collected,
       CONCAT('₹', FORMAT(SUM(i.subtotal),     2)) AS total_net_revenue,
       CONCAT('₹', FORMAT(SUM(i.total_amount), 2)) AS total_gross_revenue,
       COUNT(*) AS paid_invoice_count
FROM invoices i
WHERE i.status = 'paid';
