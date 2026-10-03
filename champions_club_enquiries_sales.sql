-- =====================================================================
--  Champions Club : Enquiries & Sales data (MySQL 8.0+)
--  Tables : enquiries, enquiry_activities, quotes, quote_items
--  Contents: dummy data only (no check queries)
-- =====================================================================

USE champions_club;

-- ==== DATA START ====

-- ---------------------------------------------------------------------
-- 1. enquiries (3 rows)
--    E1: Preethi Suresh (Walk-in, interested in Silver plan, trial booked)
--    E2: TechSoft Solutions (Corporate lead, won, converted to client 1)
--    E3: Vikram Desai (Instagram, lost due to distance)
-- ---------------------------------------------------------------------
INSERT INTO enquiries
  (id, full_name, company_name, phone, email, source, enquiry_type,
   interested_plan_id, interested_sport_id, message, status,
   assigned_to, next_follow_up_at, trial_booking_id,
   converted_member_id, business_client_id, lost_reason,
   closed_at, created_at, updated_at)
VALUES
(1, 'Preethi Suresh', NULL, '+91 98000 11111', 'preethi@example.com', 'walk_in', 'membership',
 2, 1, 'Walked in asking about tennis coaching and membership.', 'trial_booked',
 4, '2026-10-04 10:00:00', 16,
 NULL, NULL, NULL,
 NULL, '2026-10-03 09:30:00', '2026-10-03 09:45:00'),

(2, 'Neha Kulkarni', 'TechSoft Solutions Pvt Ltd', '+91 20 5555 1212', 'accounts@techsoft.example', 'website_form', 'corporate',
 NULL, NULL, 'Looking for block booking of courts for employee wellness program.', 'won',
 2, NULL, NULL,
 NULL, 1, NULL,
 '2026-09-28 14:00:00', '2026-09-25 11:00:00', '2026-09-28 14:00:00'),

(3, 'Vikram Desai', NULL, '+91 97000 99999', NULL, 'instagram', 'general',
 NULL, 2, 'DM asking for padel prices.', 'lost',
 5, NULL, NULL,
 NULL, NULL, 'Lives too far from the club (Mumbai)',
 '2026-10-02 16:00:00', '2026-10-01 14:30:00', '2026-10-02 16:00:00');

-- ---------------------------------------------------------------------
-- 2. enquiry_activities (5 rows)
-- ---------------------------------------------------------------------
INSERT INTO enquiry_activities
  (id, enquiry_id, activity_type, summary, performed_by, occurred_at)
VALUES
(1, 1, 'note',          'Customer visited front desk. Explained Silver benefits.', 4, '2026-10-03 09:35:00'),
(2, 1, 'status_change', 'Booked trial tennis session (Booking 16). Will follow up after session.', 4, '2026-10-03 09:45:00'),
(3, 2, 'email',         'Sent corporate pricing quote QT-2026-0001 for monthly court hire.', 2, '2026-09-26 10:00:00'),
(4, 2, 'status_change', 'Quote accepted. Registered as Business Client 1 (TechSoft Solutions).', 2, '2026-09-28 14:00:00'),
(5, 3, 'whatsapp',      'Sent price list. Customer replied they are based in Mumbai, looking for local courts.', 5, '2026-10-02 15:30:00');

-- ---------------------------------------------------------------------
-- 3. quotes (1 row)
--    Matches the monthly billing for TechSoft Solutions (from invoices)
-- ---------------------------------------------------------------------
INSERT INTO quotes
  (id, quote_no, enquiry_id, plan_id, business_client_id, status, valid_until,
   subtotal, discount_total, tax_total, total_amount,
   sent_at, sent_via, accepted_at, notes,
   created_by, created_at, updated_at)
VALUES
(1, 'QT-2026-0001', 2, NULL, 1, 'accepted', '2026-10-15',
 9000.00, 0.00, 1620.00, 10620.00,
 '2026-09-26 10:00:00', 'email', '2026-09-28 13:45:00', 'Monthly corporate court hire (15 sessions). Flat walk-in rate.',
 2, '2026-09-26 09:30:00', '2026-09-28 14:00:00');

-- ---------------------------------------------------------------------
-- 4. quote_items (1 row)
--    tax_rate_id = 4 (GST 18%)
-- ---------------------------------------------------------------------
INSERT INTO quote_items
  (id, quote_id, description, quantity, unit_price, discount_amount,
   tax_rate_id, tax_amount, line_total)
VALUES
(1, 1, 'Corporate Package: Monthly Court Hire (15 sessions)', 15.00, 600.00, 0.00,
 4, 1620.00, 10620.00);

-- ==== DATA END ====
