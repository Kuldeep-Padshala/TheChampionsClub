-- =====================================================================
--  Champions Club : Courts & Bookings data (MySQL 8.0+)
--  Tables : sports, courts, court_operating_hours, court_rates,
--           court_reservations, bookings, check_ins
--  Contents: dummy data + check queries  (no CREATE TABLE statements)
--  Reference date: Saturday 4 Oct 2026 (current time ~15:54 IST)
-- =====================================================================

USE champions_club;

-- ---------------------------------------------------------------------
-- OPTIONAL RESET (practice databases only — order matters for FKs)
-- ---------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS check_ins, bookings, court_reservations,
--                      court_rates, court_operating_hours, courts, sports;
-- SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- DUMMY DATA
-- ==== DATA START ====
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1  sports  (4 rows)
--      ASSUMPTION A5: club offers tennis, padel, badminton AND cricket.
--      is_active = 1 for all — remove cricket if the club drops it.
-- ---------------------------------------------------------------------
INSERT INTO sports (id, name, is_active) VALUES
(1, 'Tennis',    1),
(2, 'Padel',     1),
(3, 'Badminton', 1),
(4, 'Cricket',   1);

-- ---------------------------------------------------------------------
-- 2.2  courts  (11 rows)
--      Naming convention: numbered sequentially across the whole club.
--      Courts 1-3   Tennis   (Court 3 clay — premium / maintenance-prone)
--      Courts 4-5   Padel    (glass-walled, indoor; Court 4 = Ravi's regular)
--      Courts 6-9   Badminton (all indoor synthetic PVC)
--      Courts 10-11 Cricket nets (outdoor turf; no seating, nets only)
--      social_play_capacity: max players per court in a social session.
-- ---------------------------------------------------------------------
INSERT INTO courts
  (id, name, sport_id, surface, is_indoor, social_play_capacity, status, notes,
   created_at, updated_at)
VALUES
-- Tennis
( 1, 'Court 1', 1, 'Hard (Acrylic)',   0, 4, 'active',      NULL,                                                   '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
( 2, 'Court 2', 1, 'Hard (Acrylic)',   0, 4, 'active',      NULL,                                                   '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
( 3, 'Court 3', 1, 'Clay',             0, 4, 'maintenance', 'Premium clay court. Resurfacing scheduled 1-4 Oct 2026 by SureCourt Services.', '2026-01-02 09:00:00', '2026-10-01 06:00:00'),
-- Padel
( 4, 'Court 4', 2, 'Synthetic (Glass)',1, 4, 'active',      NULL,                                                   '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
( 5, 'Court 5', 2, 'Synthetic (Glass)',1, 4, 'active',      NULL,                                                   '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
-- Badminton
( 6, 'Badminton Court 1', 3, 'Synthetic (PVC)', 1, 12, 'active', 'Primary social-play court; highest capacity.',   '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
( 7, 'Badminton Court 2', 3, 'Synthetic (PVC)', 1,  6, 'active', NULL,                                             '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
( 8, 'Badminton Court 3', 3, 'Synthetic (PVC)', 1,  6, 'active', NULL,                                             '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
( 9, 'Badminton Court 4', 3, 'Synthetic (PVC)', 1,  6, 'active', 'Booked exclusively by Mumbai Premier Badminton League on Sunday mornings (league arrangement).', '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
-- Cricket nets (outdoor, daylight hours only)
(10, 'Cricket Net 1',     4, 'Turf',            0,  8, 'active', 'Bowling machine available on request (front desk key).', '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
(11, 'Cricket Net 2',     4, 'Turf',            0,  8, 'active', NULL,                                             '2026-01-02 09:00:00', '2026-01-02 09:00:00');

-- ---------------------------------------------------------------------
-- 2.3  court_operating_hours  (77 rows = 11 courts × 7 days)
--      day_of_week: 0 = Sunday … 6 = Saturday (PostgreSQL DOW convention)
--      Courts 1-9  : Sun 07:00-20:00 | Mon-Sat 06:00-22:00
--      Courts 10-11: Sun 07:00-18:00 | Mon-Sat 07:00-19:00 (daylight only)
-- ---------------------------------------------------------------------
INSERT INTO court_operating_hours (court_id, day_of_week, open_time, close_time) VALUES
-- Court 1 (Tennis)
( 1, 0, '07:00', '20:00'), ( 1, 1, '06:00', '22:00'), ( 1, 2, '06:00', '22:00'),
( 1, 3, '06:00', '22:00'), ( 1, 4, '06:00', '22:00'), ( 1, 5, '06:00', '22:00'), ( 1, 6, '06:00', '22:00'),
-- Court 2 (Tennis)
( 2, 0, '07:00', '20:00'), ( 2, 1, '06:00', '22:00'), ( 2, 2, '06:00', '22:00'),
( 2, 3, '06:00', '22:00'), ( 2, 4, '06:00', '22:00'), ( 2, 5, '06:00', '22:00'), ( 2, 6, '06:00', '22:00'),
-- Court 3 (Tennis Clay — same hours; blocked by reservations during maintenance)
( 3, 0, '07:00', '20:00'), ( 3, 1, '06:00', '22:00'), ( 3, 2, '06:00', '22:00'),
( 3, 3, '06:00', '22:00'), ( 3, 4, '06:00', '22:00'), ( 3, 5, '06:00', '22:00'), ( 3, 6, '06:00', '22:00'),
-- Court 4 (Padel)
( 4, 0, '07:00', '20:00'), ( 4, 1, '06:00', '22:00'), ( 4, 2, '06:00', '22:00'),
( 4, 3, '06:00', '22:00'), ( 4, 4, '06:00', '22:00'), ( 4, 5, '06:00', '22:00'), ( 4, 6, '06:00', '22:00'),
-- Court 5 (Padel)
( 5, 0, '07:00', '20:00'), ( 5, 1, '06:00', '22:00'), ( 5, 2, '06:00', '22:00'),
( 5, 3, '06:00', '22:00'), ( 5, 4, '06:00', '22:00'), ( 5, 5, '06:00', '22:00'), ( 5, 6, '06:00', '22:00'),
-- Badminton Court 1
( 6, 0, '07:00', '20:00'), ( 6, 1, '06:00', '22:00'), ( 6, 2, '06:00', '22:00'),
( 6, 3, '06:00', '22:00'), ( 6, 4, '06:00', '22:00'), ( 6, 5, '06:00', '22:00'), ( 6, 6, '06:00', '22:00'),
-- Badminton Court 2
( 7, 0, '07:00', '20:00'), ( 7, 1, '06:00', '22:00'), ( 7, 2, '06:00', '22:00'),
( 7, 3, '06:00', '22:00'), ( 7, 4, '06:00', '22:00'), ( 7, 5, '06:00', '22:00'), ( 7, 6, '06:00', '22:00'),
-- Badminton Court 3
( 8, 0, '07:00', '20:00'), ( 8, 1, '06:00', '22:00'), ( 8, 2, '06:00', '22:00'),
( 8, 3, '06:00', '22:00'), ( 8, 4, '06:00', '22:00'), ( 8, 5, '06:00', '22:00'), ( 8, 6, '06:00', '22:00'),
-- Badminton Court 4
( 9, 0, '07:00', '20:00'), ( 9, 1, '06:00', '22:00'), ( 9, 2, '06:00', '22:00'),
( 9, 3, '06:00', '22:00'), ( 9, 4, '06:00', '22:00'), ( 9, 5, '06:00', '22:00'), ( 9, 6, '06:00', '22:00'),
-- Cricket Net 1 (daylight only)
(10, 0, '07:00', '18:00'), (10, 1, '07:00', '19:00'), (10, 2, '07:00', '19:00'),
(10, 3, '07:00', '19:00'), (10, 4, '07:00', '19:00'), (10, 5, '07:00', '19:00'), (10, 6, '07:00', '19:00'),
-- Cricket Net 2 (daylight only)
(11, 0, '07:00', '18:00'), (11, 1, '07:00', '19:00'), (11, 2, '07:00', '19:00'),
(11, 3, '07:00', '19:00'), (11, 4, '07:00', '19:00'), (11, 5, '07:00', '19:00'), (11, 6, '07:00', '19:00');

-- ---------------------------------------------------------------------
-- 2.4  court_rates  (32 rows)
--      plan_id NULL  = walk-in / no membership
--      plan_id 1 (Gold)   = ₹0 (plan_included — Gold gets courts free)
--      plan_id 2 (Silver) = discounted member rate
--      plan_id 3 (Junior) = junior discounted rate
--      Peak band Mon-Fri 18:00-22:00 stored in days_of_week as JSON '[1,2,3,4,5]'.
--      Cricket peak: Mon-Fri 17:00-21:00 (before sunset).
--      prices are tax-exclusive (GST billed on the invoice line).
--      valid_from = club opening day; valid_to NULL = no expiry.
-- ---------------------------------------------------------------------
INSERT INTO court_rates
  (id, sport_id, plan_id, applies_to, days_of_week, start_time, end_time,
   price, valid_from, valid_to, is_active)
VALUES
-- ---- TENNIS (sport_id = 1) ----
-- Walk-in exclusive: off-peak (all days, no time band)
( 1, 1, NULL, 'exclusive_booking',    NULL,              NULL,    NULL,    600.00, '2026-01-02', NULL, 1),
-- Walk-in exclusive: peak surcharge Mon-Fri 18:00-22:00
( 2, 1, NULL, 'exclusive_booking',    '[1,2,3,4,5]',     '18:00', '22:00', 900.00, '2026-01-02', NULL, 1),
-- Gold: free at all times
( 3, 1, 1,    'exclusive_booking',    NULL,              NULL,    NULL,      0.00, '2026-01-02', NULL, 1),
-- Silver: discounted (all times — member rate, no peak split)
( 4, 1, 2,    'exclusive_booking',    NULL,              NULL,    NULL,    350.00, '2026-01-02', NULL, 1),
-- Junior: discounted
( 5, 1, 3,    'exclusive_booking',    NULL,              NULL,    NULL,    250.00, '2026-01-02', NULL, 1),
-- Social play per person: walk-in
( 6, 1, NULL, 'social_play_per_person', NULL,            NULL,    NULL,    250.00, '2026-01-02', NULL, 1),
-- Social play per person: Gold free
( 7, 1, 1,    'social_play_per_person', NULL,            NULL,    NULL,      0.00, '2026-01-02', NULL, 1),
-- Social play per person: Silver
( 8, 1, 2,    'social_play_per_person', NULL,            NULL,    NULL,    150.00, '2026-01-02', NULL, 1),
-- Social play per person: Junior
( 9, 1, 3,    'social_play_per_person', NULL,            NULL,    NULL,    150.00, '2026-01-02', NULL, 1),

-- ---- PADEL (sport_id = 2) ----
-- Walk-in: off-peak
(10, 2, NULL, 'exclusive_booking',    NULL,              NULL,    NULL,    800.00, '2026-01-02', NULL, 1),
-- Walk-in: peak Mon-Fri 18:00-22:00
(11, 2, NULL, 'exclusive_booking',    '[1,2,3,4,5]',     '18:00', '22:00',1200.00, '2026-01-02', NULL, 1),
-- Gold: free
(12, 2, 1,    'exclusive_booking',    NULL,              NULL,    NULL,      0.00, '2026-01-02', NULL, 1),
-- Silver
(13, 2, 2,    'exclusive_booking',    NULL,              NULL,    NULL,    450.00, '2026-01-02', NULL, 1),
-- Junior
(14, 2, 3,    'exclusive_booking',    NULL,              NULL,    NULL,    350.00, '2026-01-02', NULL, 1),
-- Social: walk-in
(15, 2, NULL, 'social_play_per_person', NULL,            NULL,    NULL,    300.00, '2026-01-02', NULL, 1),
-- Social: Gold free
(16, 2, 1,    'social_play_per_person', NULL,            NULL,    NULL,      0.00, '2026-01-02', NULL, 1),
-- Social: Silver
(17, 2, 2,    'social_play_per_person', NULL,            NULL,    NULL,    200.00, '2026-01-02', NULL, 1),
-- Social: Junior
(18, 2, 3,    'social_play_per_person', NULL,            NULL,    NULL,    200.00, '2026-01-02', NULL, 1),

-- ---- BADMINTON (sport_id = 3) ----
-- Walk-in: off-peak
(19, 3, NULL, 'exclusive_booking',    NULL,              NULL,    NULL,    350.00, '2026-01-02', NULL, 1),
-- Walk-in: peak Mon-Fri 18:00-22:00
(20, 3, NULL, 'exclusive_booking',    '[1,2,3,4,5]',     '18:00', '22:00', 500.00, '2026-01-02', NULL, 1),
-- Gold: free
(21, 3, 1,    'exclusive_booking',    NULL,              NULL,    NULL,      0.00, '2026-01-02', NULL, 1),
-- Silver
(22, 3, 2,    'exclusive_booking',    NULL,              NULL,    NULL,    200.00, '2026-01-02', NULL, 1),
-- Junior
(23, 3, 3,    'exclusive_booking',    NULL,              NULL,    NULL,    150.00, '2026-01-02', NULL, 1),
-- Social: walk-in
(24, 3, NULL, 'social_play_per_person', NULL,            NULL,    NULL,    150.00, '2026-01-02', NULL, 1),
-- Social: Gold free
(25, 3, 1,    'social_play_per_person', NULL,            NULL,    NULL,      0.00, '2026-01-02', NULL, 1),
-- Social: Silver
(26, 3, 2,    'social_play_per_person', NULL,            NULL,    NULL,    100.00, '2026-01-02', NULL, 1),
-- Social: Junior
(27, 3, 3,    'social_play_per_person', NULL,            NULL,    NULL,    100.00, '2026-01-02', NULL, 1),

-- ---- CRICKET NETS (sport_id = 4) — no social play ----
-- Walk-in: off-peak
(28, 4, NULL, 'exclusive_booking',    NULL,              NULL,    NULL,    500.00, '2026-01-02', NULL, 1),
-- Walk-in: peak Mon-Fri 17:00-21:00 (before daylight ends)
(29, 4, NULL, 'exclusive_booking',    '[1,2,3,4,5]',     '17:00', '21:00', 700.00, '2026-01-02', NULL, 1),
-- Gold: free
(30, 4, 1,    'exclusive_booking',    NULL,              NULL,    NULL,      0.00, '2026-01-02', NULL, 1),
-- Silver
(31, 4, 2,    'exclusive_booking',    NULL,              NULL,    NULL,    300.00, '2026-01-02', NULL, 1),
-- Junior
(32, 4, 3,    'exclusive_booking',    NULL,              NULL,    NULL,    200.00, '2026-01-02', NULL, 1);

-- ---------------------------------------------------------------------
-- 2.5  court_reservations  (21 rows)
--      The physical slot on a court — must never overlap (enforced by
--      the application since MySQL has no EXCLUDE USING gist).
--      reservation_type:
--        exclusive — one booking owns the court
--        social    — shared session; social_capacity sets the headcount cap
--        blocked   — maintenance / private hire; no bookings allowed
--      Times are stored as DATETIME (UTC); IST = UTC + 05:30.
--      (All times below are already adjusted to UTC for the insert.)
--
--      Cross-references (created_by → users.id):
--        2 = Sunita (Manager)    4 = Priya (Front Desk)
--        5 = Rohan (Front Desk) 12 = Ravi   16 = Vihaan  18 = Kabir
--       15 = Ananya             17 = Ishita  21 = Tanvi   22 = Arnav
-- ---------------------------------------------------------------------
INSERT INTO court_reservations
  (id, court_id, starts_at, ends_at,
   reservation_type, status,
   social_title, social_capacity, block_reason,
   created_by, created_at)
VALUES
-- ============================================================
-- Thursday 1 Oct 2026
-- ============================================================
-- Kabir books Tennis Court 1, 07:00-08:00 IST (01:30-02:30 UTC)
( 1,  1, '2026-10-01 01:30:00', '2026-10-01 02:30:00', 'exclusive', 'active', NULL, NULL, NULL, 18, '2026-09-28 04:30:00'),
-- Ananya front-desk Badminton Court 2, 10:00-11:00 IST
( 2,  7, '2026-10-01 04:30:00', '2026-10-01 05:30:00', 'exclusive', 'active', NULL, NULL, NULL,  4, '2026-10-01 04:00:00'),
-- Karan Malhotra (guest, phone booking) Padel Court 4, 19:00-20:00 IST (peak)
( 3,  4, '2026-10-01 13:30:00', '2026-10-01 14:30:00', 'exclusive', 'active', NULL, NULL, NULL,  5, '2026-09-29 06:30:00'),
-- BLOCKED: Court 3 (clay) 3-day resurfacing 1-4 Oct, 06:00-06:00 IST
( 4,  3, '2026-10-01 00:30:00', '2026-10-04 00:30:00', 'blocked',   'active', NULL, NULL, 'Clay court resurfacing — 3-day maintenance by SureCourt Services (1-4 Oct 2026). Court reopens Monday 6 Oct.', 2, '2026-09-29 06:30:00'),
-- Saanvi (Junior) Badminton Court 3, 10:00-11:00 IST (no-show)
( 5,  8, '2026-10-01 04:30:00', '2026-10-01 05:30:00', 'exclusive', 'active', NULL, NULL, NULL, 19, '2026-09-30 06:30:00'),

-- ============================================================
-- Friday 2 Oct 2026
-- ============================================================
-- Vihaan Tennis Court 1, 07:00-08:00 IST
( 6,  1, '2026-10-02 01:30:00', '2026-10-02 02:30:00', 'exclusive', 'active', NULL, NULL, NULL, 16, '2026-09-30 04:30:00'),
-- Arnav Tennis Court 2, 08:00-09:00 IST
( 7,  2, '2026-10-02 02:30:00', '2026-10-02 03:30:00', 'exclusive', 'active', NULL, NULL, NULL, 22, '2026-09-30 04:30:00'),
-- SOCIAL: Friday Night Social Badminton — Badminton Court 1, 18:00-20:00 IST, capacity 12
( 8,  6, '2026-10-02 12:30:00', '2026-10-02 14:30:00', 'social',    'active', 'Friday Night Social Badminton', 12, NULL, 2, '2026-09-01 04:30:00'),
-- Kabir Padel Court 4, 20:00-21:00 IST
( 9,  4, '2026-10-02 14:30:00', '2026-10-02 15:30:00', 'exclusive', 'active', NULL, NULL, NULL, 18, '2026-09-30 04:30:00'),
-- Vihaan Badminton Court 2, 18:30-19:30 IST — CANCELLED by member before session
(10,  7, '2026-10-02 13:00:00', '2026-10-02 14:00:00', 'exclusive', 'cancelled', NULL, NULL, NULL, 16, '2026-09-30 04:30:00'),

-- ============================================================
-- Saturday 3 Oct 2026  (TODAY — current time ~15:54 IST)
-- ============================================================
-- Ravi Padel Court 4, 07:00-08:00 IST (his standing Saturday slot)
(11,  4, '2026-10-03 01:30:00', '2026-10-03 02:30:00', 'exclusive', 'active', NULL, NULL, NULL, 12, '2026-09-27 04:30:00'),
-- Ananya Tennis Court 1, 09:00-10:00 IST
(12,  1, '2026-10-03 03:30:00', '2026-10-03 04:30:00', 'exclusive', 'active', NULL, NULL, NULL, 15, '2026-10-01 04:30:00'),
-- Guest Preethi Suresh walk-in Tennis Court 2, 10:00-11:00 IST
(13,  2, '2026-10-03 04:30:00', '2026-10-03 05:30:00', 'exclusive', 'active', NULL, NULL, NULL,  4, '2026-10-03 04:00:00'),
-- Vihaan Cricket Net 1, 08:00-09:00 IST
(14, 10, '2026-10-03 02:30:00', '2026-10-03 03:30:00', 'exclusive', 'active', NULL, NULL, NULL, 16, '2026-10-01 04:30:00'),
-- Tanvi Badminton Court 1, 11:00-12:00 IST
(15,  6, '2026-10-03 05:30:00', '2026-10-03 06:30:00', 'exclusive', 'active', NULL, NULL, NULL, 21, '2026-10-01 04:30:00'),
-- Kabir Padel Court 5, 10:00-11:00 IST  (1st of Kabir's 2 bookings today)
(16,  5, '2026-10-03 04:30:00', '2026-10-03 05:30:00', 'exclusive', 'active', NULL, NULL, NULL, 18, '2026-10-01 04:30:00'),
-- Arnav Tennis Court 1, 17:00-18:00 IST (upcoming — later today)
(17,  1, '2026-10-03 11:30:00', '2026-10-03 12:30:00', 'exclusive', 'active', NULL, NULL, NULL, 22, '2026-10-02 04:30:00'),
-- Kabir Padel Court 4, 18:30-19:30 IST  (2nd of Kabir's 2 bookings today — hits daily max)
(18,  4, '2026-10-03 13:00:00', '2026-10-03 14:00:00', 'exclusive', 'active', NULL, NULL, NULL, 18, '2026-10-02 04:30:00'),

-- ============================================================
-- Sunday 4 Oct 2026  (future)
-- ============================================================
-- Arnav Tennis Court 2, 09:00-10:00 IST
(19,  2, '2026-10-04 03:30:00', '2026-10-04 04:30:00', 'exclusive', 'active', NULL, NULL, NULL, 22, '2026-10-02 04:30:00'),
-- Ishita Badminton Court 3, 10:00-11:00 IST
(20,  8, '2026-10-04 04:30:00', '2026-10-04 05:30:00', 'exclusive', 'active', NULL, NULL, NULL, 17, '2026-10-02 04:30:00'),

-- ============================================================
-- Monday 5 Oct 2026  (future — standing recurring social slot)
-- ============================================================
-- SOCIAL: Monday Evening Social Badminton — Badminton Court 1, 18:00-19:30 IST, capacity 12
(21,  6, '2026-10-05 12:30:00', '2026-10-05 14:00:00', 'social',    'active', 'Monday Evening Social Badminton', 12, NULL, 2, '2026-09-01 04:30:00');

-- ---------------------------------------------------------------------
-- 2.6  bookings  (24 rows)
--      booking_ref: BKNG-YYYYMMDD-NNNN (sequential per day)
--      reservation_type must match court_reservations.reservation_type.
--      Exactly one of member_id / guest_id must be set (CHECK constraint).
--      membership_id: snapshot of the plan in force at booking time.
--        1=Ravi/Gold  2=Vihaan/Gold  3=Kabir/Gold  4=Arnav/Gold
--        6=Ananya/Silver  7=Ishita/Silver  8=Tanvi/Silver  9=Saanvi/Junior
--      rate_id cross-reference (from court_rates above):
--        3=Tennis Gold  4=Tennis Silver  1=Tennis walk-in off-peak
--       12=Padel Gold  11=Padel walk-in peak
--       21=Badminton Gold  22=Badminton Silver  23=Badminton Junior
--       24=Badminton walk-in social  25=Badminton Gold social
--       26=Badminton Silver social   30=Cricket Gold
--      price_basis:
--        'plan_included' = Gold (free), 'member_rate' = Silver/Junior discount,
--        'walk_in_rate'  = no membership
-- ---------------------------------------------------------------------
INSERT INTO bookings
  (id, booking_ref, reservation_id, reservation_type,
   member_id, guest_id, membership_id,
   booked_via, booked_by, is_trial,
   rate_id, price_basis, amount_charged,
   status, checked_in_at,
   cancelled_at, cancelled_by, cancellation_reason,
   notes, created_at, updated_at)
VALUES
-- ============================================================
-- Thursday 1 Oct  (all completed by now)
-- ============================================================
-- Kabir — Tennis Court 1 07:00-08:00 — Gold, free
( 1, 'BKNG-20261001-0001',  1, 'exclusive',  6, NULL, 3, 'member_app', 18, 0,  3, 'plan_included',  0.00, 'completed', '2026-10-01 01:35:00', NULL, NULL, NULL, NULL, '2026-09-28 04:30:00', '2026-10-01 02:31:00'),
-- Ananya — Badminton Court 2 10:00-11:00 — Silver ₹200, booked at front desk
( 2, 'BKNG-20261001-0002',  2, 'exclusive',  3, NULL, 6, 'front_desk',  4, 0, 22, 'member_rate',   200.00, 'completed', '2026-10-01 04:33:00', NULL, NULL, NULL, NULL, '2026-10-01 04:00:00', '2026-10-01 05:31:00'),
-- Karan Malhotra (guest 2) — Padel Court 4 19:00-20:00 — walk-in peak ₹1,200
( 3, 'BKNG-20261001-0003',  3, 'exclusive', NULL,  2, NULL, 'phone',       5, 0, 11, 'walk_in_rate', 1200.00, 'completed', NULL,                  NULL, NULL, NULL, 'Peak-rate walk-in, phone booking by Rohan. Payment collected at front desk.', '2026-09-29 06:30:00', '2026-10-01 14:31:00'),
-- Saanvi — Badminton Court 3 10:00-11:00 — Junior ₹150, NO SHOW
( 4, 'BKNG-20261001-0004',  5, 'exclusive',  7, NULL, 9, 'member_app', 19, 0, 23, 'member_rate',   150.00, 'no_show',   NULL,                  NULL, NULL, NULL, 'Junior member did not attend; guardian Nalini Desai notified by SMS.', '2026-09-30 06:30:00', '2026-10-01 05:31:00'),

-- ============================================================
-- Friday 2 Oct  (all completed; social = 5 bookings on res 8)
-- ============================================================
-- Vihaan — Tennis Court 1 07:00-08:00 — Gold, free
( 5, 'BKNG-20261002-0001',  6, 'exclusive',  4, NULL, 2, 'member_app', 16, 0,  3, 'plan_included',  0.00, 'completed', '2026-10-02 01:32:00', NULL, NULL, NULL, NULL, '2026-09-30 04:30:00', '2026-10-02 02:31:00'),
-- Arnav — Tennis Court 2 08:00-09:00 — Gold, free
( 6, 'BKNG-20261002-0002',  7, 'exclusive',  9, NULL, 4, 'member_app', 22, 0,  3, 'plan_included',  0.00, 'completed', '2026-10-02 02:34:00', NULL, NULL, NULL, NULL, '2026-09-30 04:30:00', '2026-10-02 03:31:00'),
-- Ananya — Friday Night Social Badminton — Silver social ₹100
( 7, 'BKNG-20261002-0003',  8, 'social',     3, NULL, 6, 'member_app', 15, 0, 26, 'member_rate',   100.00, 'completed', '2026-10-02 12:36:00', NULL, NULL, NULL, NULL, '2026-10-02 06:30:00', '2026-10-02 14:31:00'),
-- Ishita — Friday Night Social Badminton — Silver social ₹100
( 8, 'BKNG-20261002-0004',  8, 'social',     5, NULL, 7, 'website',    17, 0, 26, 'member_rate',   100.00, 'completed', '2026-10-02 12:39:00', NULL, NULL, NULL, NULL, '2026-10-02 06:30:00', '2026-10-02 14:31:00'),
-- Tanvi — Friday Night Social Badminton — Silver social ₹100
( 9, 'BKNG-20261002-0005',  8, 'social',     8, NULL, 8, 'member_app', 21, 0, 26, 'member_rate',   100.00, 'completed', '2026-10-02 12:41:00', NULL, NULL, NULL, NULL, '2026-10-02 06:30:00', '2026-10-02 14:31:00'),
-- Ravi — Friday Night Social Badminton — Gold social ₹0
(10, 'BKNG-20261002-0006',  8, 'social',     1, NULL, 1, 'member_app', 12, 0, 25, 'plan_included',  0.00, 'completed', '2026-10-02 12:37:00', NULL, NULL, NULL, NULL, '2026-10-02 06:30:00', '2026-10-02 14:31:00'),
-- Devika Nair (guest 6) — Friday Night Social Badminton — walk-in social ₹150
(11, 'BKNG-20261002-0007',  8, 'social',  NULL,  6, NULL, 'front_desk',  5, 0, 24, 'walk_in_rate',  150.00, 'completed', NULL,                  NULL, NULL, NULL, 'Guest accompanied Ananya Singh (CC-2026-003). Payment at front desk.', '2026-10-02 12:00:00', '2026-10-02 14:31:00'),
-- Kabir — Padel Court 4 20:00-21:00 — Gold, free
(12, 'BKNG-20261002-0008',  9, 'exclusive',  6, NULL, 3, 'member_app', 18, 0, 12, 'plan_included',  0.00, 'completed', '2026-10-02 14:31:00', NULL, NULL, NULL, NULL, '2026-09-30 04:30:00', '2026-10-02 15:31:00'),
-- Vihaan — Badminton Court 2 18:30-19:30 — CANCELLED by member at 13:00
(13, 'BKNG-20261002-0009', 10, 'exclusive',  4, NULL, 2, 'member_app', 16, 0, 21, 'plan_included',  0.00, 'cancelled', NULL, '2026-10-02 07:30:00', 16, 'Member cancelled via app — personal commitment.', NULL, '2026-09-30 04:30:00', '2026-10-02 07:30:00'),

-- ============================================================
-- Saturday 3 Oct  (morning sessions completed; afternoon upcoming)
-- ============================================================
-- Ravi — Padel Court 4 07:00-08:00 — Gold, free (standing Saturday slot)
(14, 'BKNG-20261003-0001', 11, 'exclusive',  1, NULL, 1, 'member_app', 12, 0, 12, 'plan_included',  0.00, 'completed', '2026-10-03 01:32:00', NULL, NULL, NULL, 'Regular Saturday padel practice.', '2026-09-27 04:30:00', '2026-10-03 02:31:00'),
-- Ananya — Tennis Court 1 09:00-10:00 — Silver ₹350
(15, 'BKNG-20261003-0002', 12, 'exclusive',  3, NULL, 6, 'member_app', 15, 0,  4, 'member_rate',   350.00, 'completed', '2026-10-03 03:31:00', NULL, NULL, NULL, NULL, '2026-10-01 04:30:00', '2026-10-03 04:31:00'),
-- Preethi Suresh (guest 1) — Tennis Court 2 10:00-11:00 — walk-in off-peak ₹600
(16, 'BKNG-20261003-0003', 13, 'exclusive', NULL,  1, NULL, 'walk_in',    4, 0,  1, 'walk_in_rate',  600.00, 'completed', NULL,                  NULL, NULL, NULL, 'Walk-in; expressed interest in Silver membership. Priya to follow up.', '2026-10-03 04:00:00', '2026-10-03 05:31:00'),
-- Vihaan — Cricket Net 1 08:00-09:00 — Gold, free
(17, 'BKNG-20261003-0004', 14, 'exclusive',  4, NULL, 2, 'member_app', 16, 0, 30, 'plan_included',  0.00, 'completed', '2026-10-03 02:31:00', NULL, NULL, NULL, NULL, '2026-10-01 04:30:00', '2026-10-03 03:31:00'),
-- Tanvi — Badminton Court 1 11:00-12:00 — Silver ₹200
(18, 'BKNG-20261003-0005', 15, 'exclusive',  8, NULL, 8, 'member_app', 21, 0, 22, 'member_rate',   200.00, 'completed', '2026-10-03 05:34:00', NULL, NULL, NULL, NULL, '2026-10-01 04:30:00', '2026-10-03 06:31:00'),
-- Kabir — Padel Court 5 10:00-11:00 — Gold, free  (booking 1 of 2 for Kabir today)
(19, 'BKNG-20261003-0006', 16, 'exclusive',  6, NULL, 3, 'member_app', 18, 0, 12, 'plan_included',  0.00, 'completed', '2026-10-03 04:32:00', NULL, NULL, NULL, NULL, '2026-10-01 04:30:00', '2026-10-03 05:31:00'),
-- Arnav — Tennis Court 1 17:00-18:00 — Gold, free  (upcoming this evening)
(20, 'BKNG-20261003-0007', 17, 'exclusive',  9, NULL, 4, 'member_app', 22, 0,  3, 'plan_included',  0.00, 'confirmed', NULL,                  NULL, NULL, NULL, NULL, '2026-10-02 04:30:00', '2026-10-02 04:30:00'),
-- Kabir — Padel Court 4 18:30-19:30 — Gold, free  (booking 2 of 2 for Kabir today — hits daily max)
(21, 'BKNG-20261003-0008', 18, 'exclusive',  6, NULL, 3, 'member_app', 18, 0, 12, 'plan_included',  0.00, 'confirmed', NULL,                  NULL, NULL, NULL, 'Second booking today — daily limit of 2 reached for this member.', '2026-10-02 04:30:00', '2026-10-02 04:30:00'),

-- ============================================================
-- Sunday 4 Oct  (future, confirmed)
-- ============================================================
-- Arnav — Tennis Court 2 09:00-10:00 — Gold, free
(22, 'BKNG-20261004-0001', 19, 'exclusive',  9, NULL, 4, 'member_app', 22, 0,  3, 'plan_included',  0.00, 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-10-02 04:30:00', '2026-10-02 04:30:00'),
-- Ishita — Badminton Court 3 10:00-11:00 — Silver ₹200
(23, 'BKNG-20261004-0002', 20, 'exclusive',  5, NULL, 7, 'member_app', 17, 0, 22, 'member_rate',   200.00, 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-10-02 04:30:00', '2026-10-02 04:30:00'),

-- ============================================================
-- Monday 5 Oct  (future social session — one early sign-up)
-- ============================================================
-- Ravi — Monday Evening Social Badminton — Gold social ₹0
(24, 'BKNG-20261005-0001', 21, 'social',     1, NULL, 1, 'member_app', 12, 0, 25, 'plan_included',  0.00, 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-10-03 06:30:00', '2026-10-03 06:30:00');

-- ---------------------------------------------------------------------
-- 2.7  check_ins  (14 rows — one per member arrival at the club)
--      Guests (Karan, Preethi, Devika) do not appear here because
--      check_ins.member_id is NOT NULL (only member arrivals are logged).
--      Cancelled (booking 13) and no-show (booking 4) have no check_in.
--      recorded_by: 4=Priya  5=Rohan  6=Kavya (front desk team)
-- ---------------------------------------------------------------------
INSERT INTO check_ins
  (id, member_id, booking_id, checked_in_at, method, recorded_by, notes)
VALUES
-- Thursday 1 Oct
( 1,  6,  1, '2026-10-01 01:35:00', 'member_code', 4, NULL),   -- Kabir, Tennis Court 1
( 2,  3,  2, '2026-10-01 04:33:00', 'qr',          4, NULL),   -- Ananya, Badminton Court 2

-- Friday 2 Oct
( 3,  4,  5, '2026-10-02 01:32:00', 'member_code', 5, NULL),   -- Vihaan, Tennis Court 1
( 4,  9,  6, '2026-10-02 02:34:00', 'qr',          5, NULL),   -- Arnav, Tennis Court 2
( 5,  3,  7, '2026-10-02 12:36:00', 'member_code', 5, NULL),   -- Ananya, Friday Social
( 6,  5,  8, '2026-10-02 12:39:00', 'qr',          5, NULL),   -- Ishita, Friday Social
( 7,  8,  9, '2026-10-02 12:41:00', 'qr',          5, NULL),   -- Tanvi, Friday Social
( 8,  1, 10, '2026-10-02 12:37:00', 'member_code', 5, NULL),   -- Ravi, Friday Social
( 9,  6, 12, '2026-10-02 14:31:00', 'member_code', 5, NULL),   -- Kabir, Padel Court 4

-- Saturday 3 Oct (today)
(10,  1, 14, '2026-10-03 01:32:00', 'qr',          4, 'Regular Saturday padel slot.'),  -- Ravi, Padel Court 4
(11,  4, 17, '2026-10-03 02:31:00', 'member_code', 4, NULL),   -- Vihaan, Cricket Net 1
(12,  3, 15, '2026-10-03 03:31:00', 'qr',          4, NULL),   -- Ananya, Tennis Court 1
(13,  8, 18, '2026-10-03 05:34:00', 'member_code', 6, NULL),   -- Tanvi, Badminton Court 1 (Kavya on duty)
(14,  6, 19, '2026-10-03 04:32:00', 'qr',          4, NULL);   -- Kabir, Padel Court 5

-- ==== DATA END ====


-- =====================================================================
-- CHECK QUERIES
-- =====================================================================

-- C1  Row counts
--     Expected: sports 4, courts 11, court_operating_hours 77,
--               court_rates 32, court_reservations 21, bookings 24, check_ins 14
SELECT 'sports'                AS tbl, COUNT(*) AS row_count FROM sports
UNION ALL SELECT 'courts',                  COUNT(*) FROM courts
UNION ALL SELECT 'court_operating_hours',   COUNT(*) FROM court_operating_hours
UNION ALL SELECT 'court_rates',             COUNT(*) FROM court_rates
UNION ALL SELECT 'court_reservations',      COUNT(*) FROM court_reservations
UNION ALL SELECT 'bookings',                COUNT(*) FROM bookings
UNION ALL SELECT 'check_ins',               COUNT(*) FROM check_ins;

-- C2  Courts by sport with status
SELECT s.name AS sport, c.id, c.name AS court, c.surface,
       IF(c.is_indoor, 'Indoor', 'Outdoor') AS location,
       c.social_play_capacity, c.status
FROM courts c
JOIN sports s ON s.id = c.sport_id
ORDER BY s.id, c.id;

-- C3  Opening hours for every court on a specific day (Saturday = 6)
SELECT c.name AS court, coh.open_time, coh.close_time,
       TIMEDIFF(coh.close_time, coh.open_time) AS open_hours
FROM court_operating_hours coh
JOIN courts c ON c.id = coh.court_id
WHERE coh.day_of_week = 6
ORDER BY c.id;

-- C4  Rate card grouped by sport — walk-in vs member plans
SELECT s.name AS sport,
       COALESCE(p.name, 'Walk-in') AS plan,
       cr.applies_to,
       CASE WHEN cr.start_time IS NOT NULL
            THEN CONCAT(cr.start_time, '-', cr.end_time, ' (peak)')
            ELSE 'All hours'
       END AS time_band,
       CONCAT('₹', FORMAT(cr.price, 0)) AS price_per_session
FROM court_rates cr
JOIN sports s ON s.id = cr.sport_id
LEFT JOIN membership_plans p ON p.id = cr.plan_id
WHERE cr.is_active = 1
ORDER BY s.id, COALESCE(p.sort_order, 0), cr.applies_to, cr.start_time;

-- C5  Today's court schedule (all reservations on 3 Oct 2026)
SELECT cr.id, c.name AS court, s.name AS sport,
       CONVERT_TZ(cr.starts_at, '+00:00', '+05:30') AS starts_IST,
       CONVERT_TZ(cr.ends_at,   '+00:00', '+05:30') AS ends_IST,
       cr.reservation_type, cr.status,
       COALESCE(cr.social_title, cr.block_reason, 'Exclusive booking') AS detail
FROM court_reservations cr
JOIN courts c ON c.id = cr.court_id
JOIN sports s ON s.id = c.sport_id
WHERE DATE(CONVERT_TZ(cr.starts_at, '+00:00', '+05:30')) = '2026-10-03'
ORDER BY cr.starts_at, c.id;

-- C6  Who is booked on what today — with member name and amount charged
SELECT CONVERT_TZ(cr.starts_at, '+00:00', '+05:30') AS starts_IST,
       c.name AS court, s.name AS sport,
       COALESCE(m.full_name, CONCAT('Guest ', g.id)) AS player,
       COALESCE(mp.name, 'Walk-in') AS plan,
       b.price_basis, b.amount_charged, b.status
FROM bookings b
JOIN court_reservations cr ON cr.id = b.reservation_id
JOIN courts c              ON c.id  = cr.court_id
JOIN sports s              ON s.id  = c.sport_id
LEFT JOIN members m        ON m.id  = b.member_id
LEFT JOIN guests  g        ON g.id  = b.guest_id
LEFT JOIN memberships ms   ON ms.id = b.membership_id
LEFT JOIN membership_plans mp ON mp.id = ms.plan_id
WHERE DATE(CONVERT_TZ(cr.starts_at, '+00:00', '+05:30')) = '2026-10-03'
ORDER BY cr.starts_at, c.id;

-- C7  Friday Night Social Badminton attendance (reservation 8)
--     Expected: 5 bookings — Ananya, Ishita, Tanvi, Ravi (member), Devika (guest)
SELECT b.booking_ref,
       COALESCE(m.full_name, g.full_name) AS player,
       COALESCE(mp.name, 'Walk-in')       AS plan,
       b.amount_charged, b.status
FROM bookings b
LEFT JOIN members         m  ON m.id  = b.member_id
LEFT JOIN guests          g  ON g.id  = b.guest_id
LEFT JOIN memberships     ms ON ms.id = b.membership_id
LEFT JOIN membership_plans mp ON mp.id = ms.plan_id
WHERE b.reservation_id = 8
ORDER BY b.id;

-- C8  All bookings for Kabir (member 6) — shows daily-limit illustration
SELECT b.booking_ref,
       DATE(CONVERT_TZ(cr.starts_at, '+00:00', '+05:30')) AS session_date,
       CONVERT_TZ(cr.starts_at, '+00:00', '+05:30')       AS starts_IST,
       c.name AS court, s.name AS sport,
       b.amount_charged, b.status
FROM bookings b
JOIN court_reservations cr ON cr.id = b.reservation_id
JOIN courts c              ON c.id  = cr.court_id
JOIN sports s              ON s.id  = c.sport_id
WHERE b.member_id = 6
ORDER BY cr.starts_at;

-- C9  No-shows and cancellations
SELECT b.booking_ref, b.status,
       COALESCE(m.full_name, g.full_name) AS player,
       c.name AS court,
       CONVERT_TZ(cr.starts_at, '+00:00', '+05:30') AS session_was,
       b.cancellation_reason
FROM bookings b
JOIN court_reservations cr ON cr.id = b.reservation_id
JOIN courts c              ON c.id  = cr.court_id
LEFT JOIN members m        ON m.id  = b.member_id
LEFT JOIN guests  g        ON g.id  = b.guest_id
WHERE b.status IN ('no_show','cancelled')
ORDER BY cr.starts_at;

-- C10 Member check-in frequency (total visits in this data window)
SELECT m.member_code, m.full_name,
       COUNT(ci.id)             AS total_check_ins,
       MAX(CONVERT_TZ(ci.checked_in_at, '+00:00', '+05:30')) AS last_visit_IST
FROM check_ins ci
JOIN members m ON m.id = ci.member_id
GROUP BY m.id, m.member_code, m.full_name
ORDER BY total_check_ins DESC;
