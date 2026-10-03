-- =====================================================================
--  Champions Club : Expenses, Reports & System data (MySQL 8.0+)
--  Tables : expense_categories, expenses, daily_closings, tax_returns,
--           report_shares, notifications, audit_logs
--  Contents: dummy data only (no check queries)
-- =====================================================================

USE champions_club;

-- ==== DATA START ====

-- ---------------------------------------------------------------------
-- 1. expense_categories (4 rows)
-- ---------------------------------------------------------------------
INSERT INTO expense_categories (id, name, type, is_active) VALUES
(1, 'Utility Bills',          'fixed',    1),
(2, 'Maintenance & Repairs',  'variable', 1),
(3, 'Office & Admin Supplies','variable', 1),
(4, 'Marketing & Ads',        'variable', 1);

-- ---------------------------------------------------------------------
-- 2. expenses (3 rows)
-- ---------------------------------------------------------------------
INSERT INTO expenses
  (id, category_id, date_incurred, amount, tax_amount, vendor_name,
   description, receipt_url, payment_method, recorded_by, created_at)
VALUES
(1, 1, '2026-09-28', 18500.00,    0.00, 'MSEDCL',      'September Electricity Bill', NULL, 'bank_transfer', 13, '2026-09-29 10:00:00'),
(2, 2, '2026-10-01',  2500.00,  450.00, 'FixIt Bros',   'Plumbing repair in men''s locker room', NULL, 'upi', 2, '2026-10-01 15:30:00'),
(3, 3, '2026-10-02',   650.00,   58.50, 'Metro Mart',  'Printer paper and pens for front desk', NULL, 'cash', 4, '2026-10-02 09:00:00');

-- ---------------------------------------------------------------------
-- 3. daily_closings (2 rows)
-- ---------------------------------------------------------------------
INSERT INTO daily_closings
  (id, closing_date, closed_by, cash_expected, cash_actual, cash_difference,
   card_total, upi_total, notes, created_at)
VALUES
(1, '2026-10-01', 2, 4500.00, 4500.00,   0.00, 12500.00,  8400.00, 'All matched.', '2026-10-01 23:45:00'),
(2, '2026-10-02', 2, 3200.00, 3150.00, -50.00,  9800.00, 14200.00, 'Shortage of 50 in till. Logged for review.', '2026-10-02 23:30:00');

-- ---------------------------------------------------------------------
-- 4. tax_returns (1 row)
-- ---------------------------------------------------------------------
INSERT INTO tax_returns
  (id, period_month, tax_type, status, total_tax_collected, total_tax_paid,
   net_tax_payable, filed_on, receipt_number, created_at)
VALUES
(1, '2026-09-01', 'GST', 'draft', 45200.50, 12400.00, 32800.50, NULL, NULL, '2026-10-02 11:00:00');

-- ---------------------------------------------------------------------
-- 5. report_shares (2 rows)
-- ---------------------------------------------------------------------
INSERT INTO report_shares
  (id, report_name, format, recipient_email, recipient_user_id, sent_by, sent_at)
VALUES
(1, 'September 2026 Financial Summary', 'pdf', 'rajesh@example.com', 1, 13, '2026-10-01 18:00:00'),
(2, 'Weekly Court Utilization',         'csv', 'sunita@example.com', 2, NULL, '2026-10-02 08:00:00');

-- ---------------------------------------------------------------------
-- 6. notifications (3 rows)
-- ---------------------------------------------------------------------
INSERT INTO notifications
  (id, user_id, title, message, is_read, read_at, created_at)
VALUES
(1, 1, 'Tax Draft Ready', 'September GST return draft is ready for review.', 0, NULL, '2026-10-02 11:05:00'),
(2, 2, 'Stock Alert', 'Yonex Super Grap is below reorder level (Balance: 22).', 1, '2026-10-02 11:15:00', '2026-10-02 11:10:00'),
(3, 4, 'New Enquiry', 'A new corporate enquiry was received via Website.', 1, '2026-09-25 11:10:00', '2026-09-25 11:05:00');

-- ---------------------------------------------------------------------
-- 7. audit_logs (2 rows)
-- ---------------------------------------------------------------------
INSERT INTO audit_logs
  (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, created_at)
VALUES
(1, 2, 'update', 'users', 20,
 '{"status": "active"}',
 '{"status": "suspended"}',
 '192.168.1.50', '2026-09-28 10:15:00'),

(2, 4, 'update', 'bookings', 15,
 '{"status": "confirmed"}',
 '{"status": "checked_in"}',
 '192.168.1.52', '2026-10-03 08:50:00');

-- ==== DATA END ====
