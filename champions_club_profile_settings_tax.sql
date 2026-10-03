-- =====================================================================
--  Champions Club : Club Profile, Settings & Tax tables (MySQL 8.0+)
--  Tables : club_profile, club_settings, tax_rates
--  Contents: 1) table definitions  2) dummy data  3) check queries
--  Dummy data only. Do NOT use these values in production without review.
-- =====================================================================

USE champions_club;

-- ---------------------------------------------------------------------
-- OPTIONAL RESET: un-comment to wipe these 3 tables and start again.
-- (Use only on a practice database.)
-- ---------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS club_settings, club_profile, tax_rates;
-- SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- 1) TABLE DEFINITIONS  (PostgreSQL types translated to MySQL)
--    text -> VARCHAR, timestamptz -> DATETIME (store in UTC),
--    boolean -> TINYINT(1), numeric -> DECIMAL
--    club_profile: singleton (id SMALLINT, CHECK id = 1, always 1 row)
--    club_settings: key-value store; updated_by FK to users
--    tax_rates:     lookup table used by products, bar items, invoices
-- =====================================================================

CREATE TABLE IF NOT EXISTS club_profile (
  id             SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  name           VARCHAR(150) NOT NULL,
  tagline        VARCHAR(255) NULL,
  description    TEXT         NULL,
  address_line1  VARCHAR(200) NULL,
  address_line2  VARCHAR(200) NULL,
  city           VARCHAR(100) NULL,
  state          VARCHAR(100) NULL,
  postal_code    VARCHAR(20)  NULL,
  country        CHAR(2)      NOT NULL DEFAULT 'IN',
  latitude       DECIMAL(9,6) NULL,                 -- 'find a place to play near me'
  longitude      DECIMAL(9,6) NULL,
  phone          VARCHAR(30)  NULL,
  email          VARCHAR(190) NULL,
  website_url    VARCHAR(255) NULL,
  logo_url       VARCHAR(255) NULL,
  tax_id         VARCHAR(50)  NULL,                 -- GSTIN printed on invoices
  currency_code  CHAR(3)      NOT NULL DEFAULT 'INR',
  timezone       VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_profile_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS club_settings (
  `key`        VARCHAR(100) NOT NULL,
  value        VARCHAR(500) NOT NULL,
  description  VARCHAR(500) NULL,
  updated_by   BIGINT UNSIGNED NULL,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`),
  CONSTRAINT fk_cs_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tax_rates (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name      VARCHAR(100) NOT NULL,
  rate_pct  DECIMAL(5,2) NOT NULL,
  is_active TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tax_rates_name (name),
  CONSTRAINT chk_tax_rate_pct CHECK (rate_pct BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =====================================================================
-- 2) DUMMY DATA   (run in this order: club_profile first, then settings)
-- ==== DATA START ====
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1  club_profile  (1 row — the singleton that feeds the public website,
--      invoices, booking engine and timezone calculations)
-- ---------------------------------------------------------------------
INSERT INTO club_profile (
  id, name, tagline, description,
  address_line1, address_line2, city, state, postal_code, country,
  latitude, longitude,
  phone, email, website_url, logo_url,
  tax_id, currency_code, timezone, updated_at
) VALUES (
  1,
  'The Champions Club',
  'Play More. Win Together.',
  'Mumbai''s premier multi-sport club offering tennis, padel, badminton and cricket courts, '
  'a fully stocked gear shop, cafeteria, bar and coaching programmes for all levels.',
  '14, Champions Boulevard',
  'Near Andheri Sports Complex',
  'Mumbai',
  'Maharashtra',
  '400053',
  'IN',
  19.119620,                -- approx. Andheri (W), Mumbai
  72.846580,
  '+91 22 4000 9900',
  'info@championsclub.example',
  'https://www.championsclub.example',
  'https://cdn.championsclub.example/logo/champions_club_logo.png',
  '27AABCC1234F1ZK',        -- dummy GSTIN (Maharashtra, for invoice printing)
  'INR',
  'Asia/Kolkata',
  '2026-01-02 09:00:00'
);

-- ---------------------------------------------------------------------
-- 2.2  club_settings  (18 rows, 6 groups)
--      All values are VARCHAR so the app can store numbers, booleans,
--      comma-separated lists, etc. without a schema change.
--      updated_by NULL = set during initial installation.
-- ---------------------------------------------------------------------
INSERT INTO club_settings (`key`, value, description, updated_by, updated_at) VALUES

-- ---- Booking rules (core problem-statement constraints) ----
('session_duration_minutes',        '60',
 'Length of one court session in minutes (from problem statement)',                          NULL, '2026-01-02 09:00:00'),

('slot_interval_minutes',           '30',
 'New booking slots open every this many minutes (e.g. 07:00, 07:30, 08:00)',               NULL, '2026-01-02 09:00:00'),

('max_bookings_per_member_per_day', '2',
 'Maximum court sessions any member may book on the same calendar day (problem statement)', NULL, '2026-01-02 09:00:00'),

('advance_booking_days',            '14',
 'How many days ahead a member may book a court',                                            1,    '2026-01-15 10:00:00'),

('cancellation_cutoff_hours',       '4',
 'Free cancellation is allowed up to this many hours before the session starts; '
 'later cancellations are non-refundable',                                                   1,    '2026-01-15 10:00:00'),

('booking_overlap_grace_minutes',   '5',
 'Minutes of grace time between consecutive bookings on the same court (cleaning)',          1,    '2026-01-15 10:00:00'),

-- ---- Membership & renewals ----
('membership_expiry_reminder_days', '30,7,1',
 'Comma-separated list of days before expiry when automated renewal reminders are sent',     1,    '2026-01-15 10:00:00'),

('joining_fee_waiver_on_renewal',   'false',
 'Set to true to skip the joining fee when a member renews (same plan)',                     1,    '2026-01-15 10:00:00'),

-- ---- Financial / billing ----
('invoice_due_days',                '7',
 'Default number of days after issue date when an invoice falls due (for business clients)', 1,    '2026-01-15 10:00:00'),

('cash_drawer_opening_float',       '2000',
 'Standard opening cash float in INR placed in the till at the start of each shift',        2,    '2026-02-01 09:00:00'),

('payment_methods_enabled',         'cash,card,upi,online',
 'Comma-separated list of payment methods currently accepted at the counter',                1,    '2026-01-15 10:00:00'),

('online_payment_gateway',          'Razorpay',
 'Name of the payment gateway used for website / member-app transactions',                   1,    '2026-01-15 10:00:00'),

-- ---- Operations ----
('social_play_default_capacity',    '8',
 'Default maximum number of players per social-play court session if not overridden',        2,    '2026-02-01 09:00:00'),

('trial_session_fee_inr',           '500',
 'Fee charged for a trial session booked from the website (inclusive of GST)',               1,    '2026-01-15 10:00:00'),

('guest_fee_inr',                   '300',
 'Walk-in guest court-access fee per session (exclusive of tax)',                            1,    '2026-01-15 10:00:00'),

-- ---- Notifications ----
('notification_channels_enabled',   'email,sms,whatsapp,in_app',
 'Comma-separated list of notification channels currently switched on',                      1,    '2026-03-01 09:00:00'),

('low_stock_alert_threshold',       '5',
 'Send a low-stock notification when a product variant''s available quantity falls '
 'to or below this number',                                                                  2,    '2026-02-01 09:00:00'),

-- ---- Display / locale ----
('date_format',                     'DD/MM/YYYY',
 'Date display format used in the UI, invoices and reports',                                 NULL, '2026-01-02 09:00:00');

-- ---------------------------------------------------------------------
-- 2.3  tax_rates  (5 rows)
--      Indian GST slabs used on the invoice lines, bar menu and shop.
--      id 1 = zero-rated (membership fees, court bookings for members).
--      id 2 = 5 % (food items prepared in the kitchen / cafeteria).
--      id 3 = 12% (sports equipment, some packaged goods).
--      id 4 = 18% (bar drinks, accessories, branded merchandise).
--      id 5 = 28% (luxury goods; here for completeness, not yet used).
-- ---------------------------------------------------------------------
INSERT INTO tax_rates (id, name, rate_pct, is_active) VALUES
(1, 'Exempt 0%',  0.00, 1),
(2, 'GST 5%',     5.00, 1),
(3, 'GST 12%',   12.00, 1),
(4, 'GST 18%',   18.00, 1),
(5, 'GST 28%',   28.00, 0);  -- 28% slab defined but currently inactive

-- ==== DATA END ====


-- =====================================================================
-- 3) CHECK QUERIES  (run these to confirm the data loaded correctly)
-- =====================================================================

-- 3.1  Row counts.
--      Expected: club_profile 1, club_settings 18, tax_rates 5
SELECT 'club_profile' AS tbl, COUNT(*) AS row_count FROM club_profile
UNION ALL SELECT 'club_settings', COUNT(*) FROM club_settings
UNION ALL SELECT 'tax_rates',     COUNT(*) FROM tax_rates;

-- 3.2  The one club profile row (verify address, GSTIN, timezone)
SELECT id, name, tagline, city, state,
       phone, email, tax_id, currency_code, timezone
FROM club_profile;

-- 3.3  All settings with their current values
SELECT `key`, value, description, updated_by, updated_at
FROM club_settings
ORDER BY `key`;

-- 3.4  Settings that have been personalised by a staff member (updated_by IS NOT NULL)
SELECT cs.`key`, cs.value, u.full_name AS changed_by, cs.updated_at
FROM club_settings cs
JOIN users u ON u.id = cs.updated_by
ORDER BY cs.updated_at;

-- 3.5  All tax rates, active first
SELECT id, name, rate_pct,
       IF(is_active, 'active', 'inactive') AS status
FROM tax_rates
ORDER BY is_active DESC, rate_pct;

-- 3.6  Which tax rate applies to each key module?
--      (Informational mapping; actual links live on products and bar_menu_items)
SELECT
  'Court booking (members)' AS usage, 'Exempt 0%' AS applicable_rate, 0.00 AS rate_pct
UNION ALL SELECT 'Membership fees',           'Exempt 0%',  0.00
UNION ALL SELECT 'Food / cafeteria items',    'GST 5%',     5.00
UNION ALL SELECT 'Sports equipment / shop',   'GST 12%',    12.00
UNION ALL SELECT 'Bar drinks / accessories',  'GST 18%',    18.00;

-- 3.7  Confirm the singleton constraint — should return exactly 1 row
SELECT COUNT(*) AS profile_rows,
       IF(COUNT(*) = 1, 'OK', 'ERROR: expected exactly 1 row') AS check_result
FROM club_profile;

-- 3.8  Confirm booking rules are present
SELECT `key`, value
FROM club_settings
WHERE `key` IN (
  'session_duration_minutes',
  'slot_interval_minutes',
  'max_bookings_per_member_per_day',
  'advance_booking_days',
  'cancellation_cutoff_hours'
)
ORDER BY `key`;
