-- =====================================================================
--  Champions Club : Shop & Inventory data (MySQL 8.0+)
--  Tables : product_categories, products, product_variants, suppliers,
--           purchase_orders, purchase_order_items, stock_movements,
--           shop_orders, shop_order_items
-- =====================================================================

USE champions_club;

-- ==== DATA START ====

-- product_categories  (7 rows — parent → child)
INSERT INTO product_categories (id, name, parent_id, sort_order, is_active) VALUES
(1, 'Rackets',              NULL, 1, 1),
(2, 'Tennis Rackets',       1,    1, 1),
(3, 'Badminton Rackets',    1,    2, 1),
(4, 'Padel Rackets',        1,    3, 1),
(5, 'Balls & Shuttles',     NULL, 2, 1),
(6, 'Grip & Accessories',   NULL, 3, 1),
(7, 'Apparel',              NULL, 4, 1);

-- products  (8 rows)
-- tax_rate_id: 4 = GST 18% (rackets, accessories), 3 = GST 12% (balls, apparel)
INSERT INTO products
  (id, category_id, name, brand, description,
   base_price, cost_price, tax_rate_id,
   is_listed_online, is_active, created_at, updated_at)
VALUES
(1, 3, 'Astrox 88D Pro Badminton Racket', 'Yonex',   'Head-heavy, stiff shaft — ideal for attacking doubles play.',               12500.00,  8200.00, 4, 1, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(2, 2, 'Pro Staff 97 Tennis Racket',      'Wilson',  '97 sq in, 315g — precision control for advanced players.',                   9800.00,   6500.00, 4, 1, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(3, 4, 'Delta Pro Padel Racket',          'Head',    'Round shape, carbon fibre — power and comfort for club players.',            7500.00,   4800.00, 4, 1, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(4, 5, 'Mavis 350 Shuttlecock (Pack 6)',  'Yonex',   'Nylon feather — medium pace, ideal for tropical conditions.',                  480.00,    320.00, 3, 1, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(5, 5, 'US Open Extra Duty Balls (Can 3)','Wilson',  'ITF-approved, pressurised — standard match play.',                             350.00,    220.00, 3, 1, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(6, 6, 'Super Grap Overgrip (Pack 3)',    'Yonex',   'Tacky feel, high durability — fits all racket handles.',                       280.00,    180.00, 4, 1, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(7, 7, 'Dri-FIT Training T-Shirt',        'Nike',    'Moisture-wicking polyester — available in S, M, L.',                          1200.00,    750.00, 3, 1, 1, '2026-02-01 10:00:00', '2026-02-01 10:00:00'),
(8, 7, 'Club Badminton Shorts',           'Adidas',  'Lightweight, 4-way stretch — available in M, L.',                            1400.00,    900.00, 3, 1, 1, '2026-02-01 10:00:00', '2026-02-01 10:00:00');

-- product_variants  (13 rows)
-- stock_on_hand reflects current shelf count. stock_reserved = units held for pending online orders.
INSERT INTO product_variants
  (id, product_id, sku, barcode, size, color,
   price_override, stock_on_hand, stock_reserved, reorder_level,
   is_active, created_at, updated_at)
VALUES
-- Astrox 88D Pro
( 1, 1, 'YNX-AX88D-3U-BLK', '4907054177064', '3U G5', 'Black',  NULL,     7,  0, 3, 1, '2026-01-10 10:00:00', '2026-10-01 15:00:00'),
( 2, 1, 'YNX-AX88D-4U-BLK', '4907054177071', '4U G5', 'Black',  NULL,     4,  0, 3, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
-- Wilson Pro Staff 97
( 3, 2, 'WLS-PS97-L2-BRD',  '0887768453382', 'L2',    'Black/Red', NULL,  3,  0, 2, 1, '2026-01-10 10:00:00', '2026-09-30 15:00:00'),
( 4, 2, 'WLS-PS97-L3-BRD',  '0887768453399', 'L3',    'Black/Red', NULL,  5,  0, 2, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
-- Head Delta Pro (single variant)
( 5, 3, 'HED-DLP-370-BLK',  '4901234567895', '370g',  'Black',  NULL,     6,  0, 2, 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
-- Mavis 350 Shuttlecocks
( 6, 4, 'YNX-MV350-PKT6',   '4907054233090', 'Pack 6', NULL,    NULL,    12,  0, 5, 1, '2026-01-10 10:00:00', '2026-09-30 15:00:00'),
-- Wilson Tennis Balls
( 7, 5, 'WLS-USOPEN-CAN3',  '0029882490007', 'Can 3',  NULL,    NULL,    18,  0, 6, 1, '2026-01-10 10:00:00', '2026-10-02 11:00:00'),
-- Yonex Super Grap
( 8, 6, 'YNX-SGRAP-PK3',    '4907054140051', 'Pack 3', NULL,    NULL,    22,  0, 8, 1, '2026-01-10 10:00:00', '2026-10-02 11:00:00'),
-- Nike T-Shirt
( 9, 7, 'NKE-DRY-S-WHT',   '0195869222219', 'S',      'White',  NULL,    4,  0, 3, 1, '2026-02-01 10:00:00', '2026-02-01 10:00:00'),
(10, 7, 'NKE-DRY-M-WHT',   '0195869222226', 'M',      'White',  NULL,    6,  1, 3, 1, '2026-02-01 10:00:00', '2026-09-30 19:35:00'),
(11, 7, 'NKE-DRY-L-WHT',   '0195869222233', 'L',      'White',  NULL,    5,  0, 3, 1, '2026-02-01 10:00:00', '2026-02-01 10:00:00'),
-- Adidas Shorts
(12, 8, 'ADI-CLBS-M-BLK',  '4065426181234', 'M',      'Black',  NULL,    8,  0, 3, 1, '2026-02-01 10:00:00', '2026-02-01 10:00:00'),
(13, 8, 'ADI-CLBS-L-BLK',  '4065426181241', 'L',      'Black',  NULL,    5,  0, 3, 1, '2026-02-01 10:00:00', '2026-02-01 10:00:00');

-- suppliers  (3 rows)
INSERT INTO suppliers
  (id, name, contact_person, phone, email, address,
   tax_id, payment_terms_days, is_active, created_at)
VALUES
(1, 'SportsPro Distributors',  'Manoj Rao',     '+91 22 4000 1100', 'orders@sportspro.example',   'Shed 12, APMC Market, Navi Mumbai, Maharashtra 400703', '27AAAPS1234Q1Z2', 30, 1, '2026-01-05 10:00:00'),
(2, 'Yonex India Pvt Ltd',     'Ramesh Shetty', '+91 20 6600 2200', 'trade@yonexindia.example',   'Plot 7, Hadapsar Industrial Estate, Pune, Maharashtra 411028', '27AABCY5678R1ZE', 45, 1, '2026-01-05 10:00:00'),
(3, 'Wilson Sports India',     'Anjali Menon',  '+91 80 4100 3300', 'b2b@wilsonindia.example',    '6th Floor, Prestige Tower, MG Road, Bengaluru, Karnataka 560001', '29AAACW8901S1ZK', 30, 1, '2026-01-05 10:00:00');

-- purchase_orders  (2 rows)
INSERT INTO purchase_orders
  (id, po_number, supplier_id, status,
   ordered_at, expected_on, received_at, notes,
   created_by, created_at)
VALUES
(1, 'PO-2026-0001', 1, 'received',
 '2026-09-25 11:00:00', '2026-09-30', '2026-09-30 15:00:00',
 'Monthly stock replenishment — Sep 2026. Astrox, Wilson and Mavis.',
 2, '2026-09-25 10:45:00'),
(2, 'PO-2026-0002', 2, 'ordered',
 '2026-10-03 10:00:00', '2026-10-10', NULL,
 'Low-stock reorder for Super Grap and Adidas Shorts L. Urgent — Super Grap near reorder level.',
 2, '2026-10-03 09:50:00');

-- purchase_order_items  (5 rows)
INSERT INTO purchase_order_items
  (id, purchase_order_id, variant_id,
   quantity_ordered, quantity_received, unit_cost, line_total)
VALUES
-- PO1 (received in full)
(1, 1,  1, 10, 10, 8200.00, 82000.00),   -- Astrox 3U
(2, 1,  3,  5,  5, 6500.00, 32500.00),   -- Wilson L2
(3, 1,  6, 24, 24,  320.00,  7680.00),   -- Mavis 350 (24 packs)
-- PO2 (placed, not yet received)
(4, 2,  8, 30,  0,  180.00,  5400.00),   -- Super Grap
(5, 2, 13, 10,  0,  900.00,  9000.00);   -- Adidas Shorts L

-- stock_movements  (8 rows)
-- reason: purchase_received | sale | online_order | adjustment
-- reference_type + reference_id point to the causing record.
-- balance_after reflects stock_on_hand of that variant after the move.
INSERT INTO stock_movements
  (id, variant_id, quantity_change, reason,
   reference_type, reference_id, balance_after,
   notes, performed_by, created_at)
VALUES
-- PO1 goods received 30 Sep
(1,  1, +10, 'purchase_received', 'purchase_order', 1,  10, NULL, 2, '2026-09-30 15:10:00'),
(2,  3,  +5, 'purchase_received', 'purchase_order', 1,   5, NULL, 2, '2026-09-30 15:12:00'),
(3,  6, +24, 'purchase_received', 'purchase_order', 1,  24, NULL, 2, '2026-09-30 15:15:00'),
-- Transit-damage adjustment (2 Astrox 3U arrived dented; written off)
(4,  1,  -2, 'damage',            'purchase_order', 1,   8, 'Two units dented in transit. Supplier claim raised against PO-2026-0001.', 2, '2026-09-30 16:00:00'),
-- Counter sale — shop_order 1 (1 Oct, Vihaan, Astrox 3U)
(5,  1,  -1, 'sale',              'shop_order',     1,   7, NULL, 4, '2026-10-01 18:20:00'),
-- Counter sale — shop_order 2 (2 Oct, Ananya, Super Grap + Tennis Balls)
(6,  8,  -1, 'sale',              'shop_order',     2,  22, NULL, 4, '2026-10-02 11:10:00'),
(7,  7,  -1, 'sale',              'shop_order',     2,  18, NULL, 4, '2026-10-02 11:10:00'),
-- Online order — shop_order 3 (30 Sep, Arnav, Nike T-Shirt M — reserved on order, dispatched next day)
(8, 10,  -1, 'online_order',      'shop_order',     3,   6, 'Reserved at checkout; stock deducted on order confirmation.', 4, '2026-09-30 19:35:00');

-- shop_orders  (3 rows)
-- member_discount_pct: Gold 15%, Silver 10%
-- Order 1: Vihaan (Gold, counter, 1 Oct)  Order 2: Ananya (Silver, counter, 2 Oct)
-- Order 3: Arnav (Gold, online, 30 Sep — self-checkout via member app)
INSERT INTO shop_orders
  (id, order_no,
   member_id, guest_id,
   channel, fulfillment_type, status,
   taken_by, member_discount_pct,
   subtotal, discount_total, tax_total, delivery_fee, total_amount,
   placed_at, ready_at, completed_at, updated_at)
VALUES
(1, 'SH-20261001-0001',
 4, NULL,
 'counter', 'in_store', 'completed',
 4, 15.00,
 12500.00, 1875.00, 1912.50, 0.00, 12537.50,
 '2026-10-01 18:15:00', '2026-10-01 18:18:00', '2026-10-01 18:22:00', '2026-10-01 18:22:00'),

(2, 'SH-20261002-0001',
 3, NULL,
 'counter', 'in_store', 'completed',
 4, 10.00,
 630.00, 63.00, 83.16, 0.00, 650.16,
 '2026-10-02 11:05:00', '2026-10-02 11:07:00', '2026-10-02 11:10:00', '2026-10-02 11:10:00'),

(3, 'SH-20260930-0001',
 9, NULL,
 'online', 'pickup', 'completed',
 NULL, 15.00,
 1200.00, 180.00, 122.40, 0.00, 1142.40,
 '2026-09-30 19:30:00', '2026-10-01 10:00:00', '2026-10-01 12:00:00', '2026-10-01 12:00:00');

-- shop_order_items  (4 rows)
-- unit_price and product_name are snapshots at time of sale.
-- discount_amount = unit_price × member_discount_pct / 100
-- tax_amount computed on post-discount price
INSERT INTO shop_order_items
  (id, order_id, variant_id, product_name,
   quantity, unit_price, discount_amount,
   tax_rate_id, tax_amount, line_total)
VALUES
-- Order 1: Vihaan — Astrox 88D 3U (GST 18%, 15% member disc)
(1, 1, 1, 'Yonex Astrox 88D Pro Badminton Racket, 3U G5 (Black)',
 1, 12500.00, 1875.00, 4, 1912.50, 12537.50),

-- Order 2: Ananya — Super Grap (GST 18%) + Tennis Balls (GST 12%), 10% disc
(2, 2, 8, 'Yonex Super Grap Overgrip, Pack of 3',
 1,   280.00,   28.00, 4,   45.36,   297.36),
(3, 2, 7, 'Wilson US Open Extra Duty Tennis Balls, Can of 3',
 1,   350.00,   35.00, 3,   37.80,   352.80),

-- Order 3: Arnav (online) — Nike Dri-FIT T-Shirt M (GST 12%, 15% disc)
(4, 3, 10, 'Nike Dri-FIT Training T-Shirt, M (White)',
 1,  1200.00,  180.00, 3,  122.40,  1142.40);

-- ==== DATA END ====
