-- =====================================================================
--  Champions Club : Bar & Cafeteria data (MySQL 8.0+)
--  Tables : bar_menu_categories, bar_menu_items, dining_tables,
--           bar_tabs, bar_orders, bar_order_items
--  Contents: dummy data only (no check queries)
-- =====================================================================

USE champions_club;

-- ==== DATA START ====

-- ---------------------------------------------------------------------
-- 1. bar_menu_categories (4 rows)
-- ---------------------------------------------------------------------
INSERT INTO bar_menu_categories (id, name, sort_order, is_active) VALUES
(1, 'Hot Beverages',  1, 1),
(2, 'Cold Beverages', 2, 1),
(3, 'Snacks & Bites', 3, 1),
(4, 'Main Meals',     4, 1);

-- ---------------------------------------------------------------------
-- 2. bar_menu_items (8 rows)
--    tax_rate_id = 2 (GST 5% for F&B)
--    station = 'bar', 'kitchen', or 'beverage'
-- ---------------------------------------------------------------------
INSERT INTO bar_menu_items 
  (id, category_id, name, description, price, tax_rate_id, station, is_available, is_active, image_url, created_at, updated_at)
VALUES
(1, 1, 'Espresso',              'Single shot espresso',                 100.00, 2, 'beverage', 1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(2, 2, 'Cold Coffee',           'Iced coffee with cream',               150.00, 2, 'beverage', 1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(3, 2, 'Fresh Lime Soda',       'Sweet or salted refreshing soda',       80.00, 2, 'bar',      1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(4, 3, 'Club Sandwich',         'Grilled chicken, egg, cheese, lettuce',200.00, 2, 'kitchen',  1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(5, 3, 'French Fries',          'Crispy salted potato fries',           120.00, 2, 'kitchen',  1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(6, 4, 'Penne Alfredo',         'Creamy white sauce pasta',             300.00, 2, 'kitchen',  1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(7, 4, 'Grilled Chicken Salad', 'Healthy bowl with vinaigrette',        280.00, 2, 'kitchen',  1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(8, 2, 'Protein Shake',         'Whey protein with banana and milk',    250.00, 2, 'bar',      1, 1, NULL, '2026-01-05 09:00:00', '2026-01-05 09:00:00');

-- ---------------------------------------------------------------------
-- 3. dining_tables (8 rows)
-- ---------------------------------------------------------------------
INSERT INTO dining_tables (id, table_number, seats, zone, status) VALUES
(1, 'T-01', 4, 'indoor',  'free'),
(2, 'T-02', 4, 'indoor',  'free'),
(3, 'T-03', 4, 'indoor',  'free'),
(4, 'T-04', 4, 'indoor',  'occupied'),
(5, 'T-05', 6, 'terrace', 'free'),
(6, 'T-06', 6, 'terrace', 'occupied'),
(7, 'T-07', 2, 'lounge',  'free'),
(8, 'T-08', 2, 'lounge',  'cleaning');

-- ---------------------------------------------------------------------
-- 4. bar_tabs (3 rows)
--    opened_by / closed_by: 7 = Imran, 8 = Deepa (Bar Staff)
-- ---------------------------------------------------------------------
INSERT INTO bar_tabs
  (id, tab_no, member_id, guest_id, guest_name, table_id, status, opened_by, opened_at, settled_at, closed_by)
VALUES
-- Tab 1: Ravi Shankar (Gold Member), settled
(1, 'TAB-20261003-01', 1,    NULL, NULL,               1, 'settled', 7, '2026-10-03 10:15:00', '2026-10-03 11:30:00', 7),
-- Tab 2: Kabir Khanna (Gold Member), open on Terrace
(2, 'TAB-20261003-02', 6,    NULL, NULL,               6, 'open',    8, '2026-10-03 18:05:00', NULL,                  NULL),
-- Tab 3: Walk-in guest (Amit), occupied Indoor table 4
(3, 'TAB-20261003-03', NULL, NULL, 'Amit (Walk-in)',   4, 'open',    7, '2026-10-03 18:45:00', NULL,                  NULL);

-- ---------------------------------------------------------------------
-- 5. bar_orders (3 rows)
--    member_discount_pct: Gold = 10% bar discount (from plans)
-- ---------------------------------------------------------------------
INSERT INTO bar_orders
  (id, order_no, tab_id, table_id, member_id, guest_id, taken_by, status,
   member_discount_pct, subtotal, discount_total, tax_total, total_amount,
   notes, placed_at, served_at, cancelled_at, cancellation_reason, updated_at)
VALUES
-- Order 1: Ravi (Tab 1, settled). Subtotal 400, 10% disc=40, Tax(5% of 360)=18, Total=378
(1, 'BO-20261003-001', 1, 1, 1,    NULL, 7, 'served',  
 10.00,  400.00,  40.00,  18.00,  378.00, 
 'Extra napkins', '2026-10-03 10:20:00', '2026-10-03 10:35:00', NULL, NULL, '2026-10-03 10:35:00'),

-- Order 2: Kabir (Tab 2, open). Subtotal 280, 10% disc=28, Tax(5% of 252)=12.60, Total=264.60
(2, 'BO-20261003-002', 2, 6, 6,    NULL, 8, 'served',  
 10.00,  280.00,  28.00,  12.60,  264.60, 
 'Make fries extra crispy', '2026-10-03 18:10:00', '2026-10-03 18:25:00', NULL, NULL, '2026-10-03 18:25:00'),

-- Order 3: Guest Amit (Tab 3, open). Subtotal 450, 0% disc, Tax(5% of 450)=22.50, Total=472.50
(3, 'BO-20261003-003', 3, 4, NULL, NULL, 7, 'preparing', 
  0.00,  450.00,   0.00,  22.50,  472.50, 
 NULL, '2026-10-03 18:50:00', NULL, NULL, NULL, '2026-10-03 18:50:00');

-- ---------------------------------------------------------------------
-- 6. bar_order_items (7 rows)
-- ---------------------------------------------------------------------
INSERT INTO bar_order_items
  (id, order_id, menu_item_id, item_name, quantity, unit_price, discount_amount,
   tax_rate_id, tax_amount, line_total, station, kitchen_status, special_instructions, ready_at)
VALUES
-- Order 1 (Ravi): 2x Espresso (200), 1x Club Sandwich (200). 10% disc.
(1, 1, 1, 'Espresso',       2, 100.00,  20.00, 2,   9.00, 189.00, 'beverage', 'served', NULL, '2026-10-03 10:25:00'),
(2, 1, 4, 'Club Sandwich',  1, 200.00,  20.00, 2,   9.00, 189.00, 'kitchen',  'served', 'No mayo', '2026-10-03 10:32:00'),

-- Order 2 (Kabir): 2x Fresh Lime Soda (160), 1x French Fries (120). 10% disc.
(3, 2, 3, 'Fresh Lime Soda',2,  80.00,  16.00, 2,   7.20, 151.20, 'bar',      'served', 'Salted', '2026-10-03 18:15:00'),
(4, 2, 5, 'French Fries',   1, 120.00,  12.00, 2,   5.40, 113.40, 'kitchen',  'served', 'Extra crispy', '2026-10-03 18:22:00'),

-- Order 3 (Amit): 1x Penne Alfredo (300), 1x Cold Coffee (150). No disc.
(5, 3, 6, 'Penne Alfredo',  1, 300.00,   0.00, 2,  15.00, 315.00, 'kitchen',  'preparing', NULL, NULL),
(6, 3, 2, 'Cold Coffee',    1, 150.00,   0.00, 2,   7.50, 157.50, 'beverage', 'ready', 'Less ice', '2026-10-03 18:55:00');

-- ==== DATA END ====
