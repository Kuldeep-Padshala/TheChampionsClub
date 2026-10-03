-- =====================================================================
--  Champions Club : Members & Plans tables (MySQL 8.0+)
--  Tables : membership_plans, plan_benefits, guardians, members,
--           memberships, guests, business_clients, member_notes
--  Contents: 1) table definitions  2) dummy data  3) check queries
--  Dummy data only. Do NOT use these records in production.
-- =====================================================================

USE champions_club;

-- ---------------------------------------------------------------------
-- OPTIONAL RESET: un-comment to wipe these 8 tables and start again.
-- (Use only on a practice database. Order matters because of FKs.)
-- ---------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS member_notes, memberships, members,
--                      guests, business_clients, plan_benefits,
--                      membership_plans, guardians;
-- SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- 1) TABLE DEFINITIONS  (PostgreSQL types translated to MySQL)
--    text -> VARCHAR, timestamptz -> DATETIME (store in UTC),
--    boolean -> TINYINT(1), numeric -> DECIMAL, bigint -> BIGINT UNSIGNED
-- =====================================================================

-- Three membership tiers: Gold (premium), Silver (standard), Junior (under 18).
-- Court prices per plan live separately in court_rates (section 5).
CREATE TABLE IF NOT EXISTS membership_plans (
  id                   BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  code                 VARCHAR(20)       NOT NULL,
  name                 VARCHAR(100)      NOT NULL,
  description          TEXT              NULL,
  fee                  DECIMAL(10,2)     NOT NULL,           -- monthly / plan fee
  duration_months      SMALLINT UNSIGNED NOT NULL,
  joining_fee          DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  min_age              SMALLINT UNSIGNED NULL,
  max_age              SMALLINT UNSIGNED NULL,               -- Junior cap: 17
  shop_discount_pct    DECIMAL(5,2)      NOT NULL DEFAULT 0.00,
  bar_discount_pct     DECIMAL(5,2)      NOT NULL DEFAULT 0.00,
  can_join_social_play TINYINT(1)        NOT NULL DEFAULT 1,
  is_active            TINYINT(1)        NOT NULL DEFAULT 1,
  sort_order           SMALLINT          NOT NULL DEFAULT 0,
  created_at           DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plans_code (code),
  CONSTRAINT chk_plan_fee         CHECK (fee               >= 0),
  CONSTRAINT chk_plan_joining     CHECK (joining_fee        >= 0),
  CONSTRAINT chk_plan_duration    CHECK (duration_months     > 0),
  CONSTRAINT chk_plan_shop_disc   CHECK (shop_discount_pct  BETWEEN 0 AND 100),
  CONSTRAINT chk_plan_bar_disc    CHECK (bar_discount_pct   BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bullet-point benefits shown on the website plan-comparison page.
CREATE TABLE IF NOT EXISTS plan_benefits (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_id     BIGINT UNSIGNED NOT NULL,
  description VARCHAR(500)    NOT NULL,
  sort_order  SMALLINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_pb_plan (plan_id),
  CONSTRAINT fk_pb_plan FOREIGN KEY (plan_id)
    REFERENCES membership_plans (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Parent or guardian on file for every Junior (under-18) member.
CREATE TABLE IF NOT EXISTS guardians (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name    VARCHAR(150) NOT NULL,
  phone        VARCHAR(30)  NOT NULL,
  email        VARCHAR(190) NULL,
  relationship VARCHAR(50)  NULL,        -- 'Mother', 'Father', 'Guardian' ...
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One login account per member (user_id). Desk-only members have user_id = NULL.
-- NOTE: The PostgreSQL CHECK (guardian_id IS NOT NULL OR dob <= today - 18 years)
--       references CURRENT_DATE in a non-deterministic way; MySQL 8.0 supports it
--       but some distributions restrict it. Enforce this rule at the application layer.
CREATE TABLE IF NOT EXISTS members (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_code             VARCHAR(20)  NOT NULL,    -- card number, e.g. CC-2026-001
  qr_token                VARCHAR(50)  NOT NULL,    -- 32-char hex; scanned at check-in
  user_id                 BIGINT UNSIGNED NULL,     -- links to users table (online login)
  full_name               VARCHAR(150) NOT NULL,
  date_of_birth           DATE         NOT NULL,
  phone                   VARCHAR(30)  NOT NULL,
  email                   VARCHAR(190) NULL,
  address_line1           VARCHAR(200) NULL,
  address_line2           VARCHAR(200) NULL,
  city                    VARCHAR(100) NULL,
  postal_code             VARCHAR(20)  NULL,
  photo_url               VARCHAR(255) NULL,        -- quick face-recognition for staff
  emergency_contact_name  VARCHAR(150) NULL,
  emergency_contact_phone VARCHAR(30)  NULL,
  guardian_id             BIGINT UNSIGNED NULL,     -- mandatory when member is under 18
  status                  VARCHAR(20)  NOT NULL DEFAULT 'active',
  joined_on               DATE         NOT NULL,
  registered_by           BIGINT UNSIGNED NULL,     -- front-desk user who signed them up
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_members_code (member_code),
  UNIQUE KEY uq_members_qr   (qr_token),
  UNIQUE KEY uq_members_user (user_id),
  CONSTRAINT chk_members_status    CHECK (status IN ('active','suspended','left')),
  CONSTRAINT chk_members_dob       CHECK (date_of_birth <= CURRENT_DATE),
  CONSTRAINT fk_members_user       FOREIGN KEY (user_id)       REFERENCES users (id),
  CONSTRAINT fk_members_guardian   FOREIGN KEY (guardian_id)   REFERENCES guardians (id),
  CONSTRAINT fk_members_reg_by     FOREIGN KEY (registered_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A member's plan over time. Renewal / upgrade / downgrade = a NEW row linked to the previous one.
-- NOTE: MySQL has no range-exclusion constraints. The rule "a member cannot hold two overlapping
--       active memberships" (PostgreSQL EXCLUDE USING gist) must be enforced by the application
--       or via a BEFORE INSERT trigger on this table.
CREATE TABLE IF NOT EXISTS memberships (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id              BIGINT UNSIGNED NOT NULL,
  plan_id                BIGINT UNSIGNED NOT NULL,
  start_date             DATE         NOT NULL,
  end_date               DATE         NOT NULL,    -- expiry; renewal reminders driven by this
  status                 VARCHAR(20)  NOT NULL DEFAULT 'pending',
  started_as             VARCHAR(20)  NOT NULL DEFAULT 'new',
  previous_membership_id BIGINT UNSIGNED NULL,     -- set on renewal / upgrade / downgrade
  auto_renew             TINYINT(1)   NOT NULL DEFAULT 0,
  fee_charged            DECIMAL(10,2) NOT NULL,   -- snapshot of plan.fee at time of sale
  joining_fee_charged    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cancelled_at           DATETIME NULL,
  cancelled_by           BIGINT UNSIGNED NULL,
  cancellation_reason    VARCHAR(500) NULL,
  created_by             BIGINT UNSIGNED NULL,     -- NULL = online / self-service
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ms_member (member_id, status),
  KEY idx_ms_plan   (plan_id),
  KEY idx_ms_expiry (end_date),
  CONSTRAINT chk_ms_status     CHECK (status     IN ('pending','active','expired','cancelled','changed')),
  CONSTRAINT chk_ms_started_as CHECK (started_as IN ('new','renewal','upgrade','downgrade')),
  CONSTRAINT chk_ms_dates      CHECK (end_date   >= start_date),
  CONSTRAINT chk_ms_fee        CHECK (fee_charged         >= 0),
  CONSTRAINT chk_ms_join_fee   CHECK (joining_fee_charged >= 0),
  CONSTRAINT fk_ms_member      FOREIGN KEY (member_id)              REFERENCES members (id),
  CONSTRAINT fk_ms_plan        FOREIGN KEY (plan_id)                REFERENCES membership_plans (id),
  CONSTRAINT fk_ms_prev        FOREIGN KEY (previous_membership_id) REFERENCES memberships (id),
  CONSTRAINT fk_ms_cancelled   FOREIGN KEY (cancelled_by)           REFERENCES users (id),
  CONSTRAINT fk_ms_created_by  FOREIGN KEY (created_by)             REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Walk-in visitors and non-members. converted_member_id is set when they later join.
CREATE TABLE IF NOT EXISTS guests (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name           VARCHAR(150) NOT NULL,
  phone               VARCHAR(30)  NULL,
  email               VARCHAR(190) NULL,
  source              VARCHAR(20)  NOT NULL DEFAULT 'walk_in',
  converted_member_id BIGINT UNSIGNED NULL,    -- set when the guest becomes a member
  notes               TEXT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_guests_source CHECK (source IN ('walk_in','phone','website','bar')),
  CONSTRAINT fk_guests_member  FOREIGN KEY (converted_member_id) REFERENCES members (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Companies the club invoices for corporate memberships, court hire and events.
CREATE TABLE IF NOT EXISTS business_clients (
  id                 BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  company_name       VARCHAR(200) NOT NULL,
  contact_person     VARCHAR(150) NULL,
  email              VARCHAR(190) NULL,
  phone              VARCHAR(30)  NULL,
  billing_address1   VARCHAR(200) NULL,
  billing_address2   VARCHAR(200) NULL,
  city               VARCHAR(100) NULL,
  state              VARCHAR(100) NULL,
  postal_code        VARCHAR(20)  NULL,
  tax_id             VARCHAR(50)  NULL,          -- client GSTIN, printed on invoices
  payment_terms_days SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  status             VARCHAR(20)  NOT NULL DEFAULT 'active',
  notes              TEXT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_bc_status         CHECK (status IN ('active','inactive')),
  CONSTRAINT chk_bc_payment_terms  CHECK (payment_terms_days >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Internal staff notes shown on a member's profile (allergies, flags, follow-ups).
CREATE TABLE IF NOT EXISTS member_notes (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id  BIGINT UNSIGNED NOT NULL,
  note       TEXT            NOT NULL,
  is_pinned  TINYINT(1)      NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mn_member (member_id),
  CONSTRAINT fk_mn_member     FOREIGN KEY (member_id)  REFERENCES members (id) ON DELETE CASCADE,
  CONSTRAINT fk_mn_created_by FOREIGN KEY (created_by) REFERENCES users   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =====================================================================
-- 2) DUMMY DATA   (run in this order: parents first, link tables last)
-- ==== DATA START ====
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1  membership_plans  (3 rows)
--      Gold  : premium, 12-month, zero court fee, top discounts
--      Silver : standard, 6-month, discounted court rate
--      Junior : under-18, 12-month, coach programme access
--      Fees are tax-exclusive (GST billed on the invoice line).
-- ---------------------------------------------------------------------
INSERT INTO membership_plans
  (id, code, name, description,
   fee, duration_months, joining_fee,
   min_age, max_age,
   shop_discount_pct, bar_discount_pct,
   can_join_social_play, is_active, sort_order,
   created_at, updated_at)
VALUES
(1, 'gold',
 'Gold',
 'Premium membership with unlimited court access at zero court fee, priority bookings and top-tier discounts across the club',
 7999.00, 12, 1999.00,
 NULL, NULL,
 15.00, 10.00,
 1, 1, 1,
 '2026-01-02 09:00:00', '2026-01-02 09:00:00'),

(2, 'silver',
 'Silver',
 'Standard membership with discounted court rates and member pricing across the shop and bar',
 3999.00, 6, 999.00,
 NULL, NULL,
 10.00, 5.00,
 1, 1, 2,
 '2026-01-02 09:00:00', '2026-01-02 09:00:00'),

(3, 'junior',
 'Junior',
 'Specially priced plan for members under 18, including priority enrolment in coaching programmes and social-play sessions',
 2499.00, 12, 499.00,
 NULL, 17,
 5.00, 0.00,
 1, 1, 3,
 '2026-01-02 09:00:00', '2026-01-02 09:00:00');

-- ---------------------------------------------------------------------
-- 2.2  plan_benefits  (15 rows: Gold 6, Silver 5, Junior 4)
--      These are the bullet points on the public plan-comparison page.
-- ---------------------------------------------------------------------
INSERT INTO plan_benefits (id, plan_id, description, sort_order) VALUES
-- Gold (plan_id = 1)
( 1, 1, 'Unlimited court sessions at zero court fee — any court, any time of day',                               1),
( 2, 1, 'Priority booking window — reserve courts up to 14 days in advance',                                    2),
( 3, 1, '15% discount on all gear-shop purchases; 10% off at the bar and cafeteria',                             3),
( 4, 1, 'One complimentary guest pass per calendar month (peak or off-peak)',                                    4),
( 5, 1, 'Full access to social-play sessions and invitations to all club tournaments',                           5),
( 6, 1, 'Dedicated personal locker assignment and complimentary fresh towel on every visit',                     6),
-- Silver (plan_id = 2)
( 7, 2, 'Court bookings at the discounted member rate (lower than walk-in price)',                               1),
( 8, 2, 'Advance booking window of 7 days',                                                                     2),
( 9, 2, '10% discount at the gear shop; 5% off at the bar and cafeteria',                                       3),
(10, 2, 'Full access to social-play sessions',                                                                   4),
(11, 2, 'Option to upgrade to Gold at any time — joining fee waived for existing Silver members',                5),
-- Junior (plan_id = 3)
(12, 3, 'Discounted junior court rate for members under 18 (proof of age required at sign-up)',                  1),
(13, 3, 'Priority enrolment in junior coaching programmes and inter-club junior sessions',                       2),
(14, 3, '5% discount at the gear shop on rackets, balls and accessories',                                        3),
(15, 3, 'Guardian consent required for all court bookings; accompanied play mandatory for members under 14',     4);

-- ---------------------------------------------------------------------
-- 2.3  guardians  (1 row)
--      Saanvi Desai (member 7, DOB 2009-12-05, age 16) is the only
--      junior in this batch; her mother is the registered guardian.
-- ---------------------------------------------------------------------
INSERT INTO guardians (id, full_name, phone, email, relationship, created_at) VALUES
(1, 'Nalini Desai', '+91 98765 30019', 'nalini.desai@example.com', 'Mother', '2026-09-15 20:00:00');

-- ---------------------------------------------------------------------
-- 2.4  members  (9 rows)
--      user_id links to users from the access & security file.
--      member_code: CC-YYYY-NNN (chronological by joined_on date).
--      qr_token: 32-char hex (would normally be gen_random_uuid() output).
--      registered_by matches user_roles.assigned_by in the access file:
--        NULL = self-signup or staff account,  4 = Priya,  5 = Rohan
--
--      Special cases:
--        id 1   Ravi Shankar   — holds COACH + MEMBER roles (two roles, one login)
--        id 2   Rahul Bose     — suspended; member.status mirrors users.status
--        id 7   Saanvi Desai   — junior (age 16), guardian_id = 1
-- ---------------------------------------------------------------------
INSERT INTO members
  (id, member_code, qr_token,
   user_id, full_name, date_of_birth, phone, email,
   address_line1, address_line2, city, postal_code,
   emergency_contact_name, emergency_contact_phone,
   guardian_id, status, joined_on, registered_by,
   created_at, updated_at)
VALUES
-- Coach who is also a member (two roles on the same login)
(1,  'CC-2026-001', 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
 12, 'Ravi Shankar',   '1985-06-15', '+91 98200 10012', 'ravi.shankar@championsclub.example',
 '7, Linking Road', 'Bandra West', 'Mumbai', '400050',
 'Meena Shankar', '+91 98200 10099',
 NULL, 'active', '2026-03-22', NULL,
 '2026-03-22 18:00:00', '2026-03-22 18:00:00'),

-- Suspended member (outstanding bar tab; account blocked by owner on 1 Sep 2026)
(2,  'CC-2026-002', 'b2c3d4e5f6071829304a5b6c7d8e9f01',
 20, 'Rahul Bose',     '1995-09-18', '+91 98765 20020', 'rahul.bose@example.com',
 '32, Hill Road', 'Bandra East', 'Mumbai', '400051',
 'Shalini Bose', '+91 98765 20021',
 NULL, 'suspended', '2026-07-20', 4,
 '2026-07-20 10:05:00', '2026-09-01 12:00:00'),

-- Signed up at front desk by Priya (user 4)
(3,  'CC-2026-003', 'c3d4e5f607182930415b6c7d8e9f0a12',
 15, 'Ananya Singh',   '1998-03-22', '+91 98765 20015', 'ananya.singh@example.com',
 '5, Pali Hill', NULL, 'Mumbai', '400050',
 'Rajiv Singh', '+91 98765 20010',
 NULL, 'active', '2026-09-03', 4,
 '2026-09-03 17:20:00', '2026-09-03 17:20:00'),

-- Self-signup online
(4,  'CC-2026-004', 'd4e5f60718293041526c7d8e9f0a1b23',
 16, 'Vihaan Reddy',   '1992-11-08', '+91 98765 20016', 'vihaan.reddy@example.com',
 '12, Versova Road', NULL, 'Mumbai', '400061',
 'Kavitha Reddy', '+91 98765 20014',
 NULL, 'active', '2026-09-05', NULL,
 '2026-09-05 11:00:00', '2026-09-05 11:00:00'),

-- Signed up at front desk by Rohan (user 5) after a walk-in trial session
(5,  'CC-2026-005', 'e5f607182930415263d7e8f90a1b2c34',
 17, 'Ishita Menon',   '2001-07-14', '+91 98765 20017', 'ishita.menon@example.com',
 '8, Cuffe Parade', NULL, 'Mumbai', '400005',
 'Priya Menon', '+91 98765 20011',
 NULL, 'active', '2026-09-08', 5,
 '2026-09-08 18:35:00', '2026-09-08 18:35:00'),

-- Self-signup online
(6,  'CC-2026-006', 'f60718293041526374e8f90a1b2c3d45',
 18, 'Kabir Khanna',   '1988-04-30', '+91 98765 20018', 'kabir.khanna@example.com',
 '21, Worli Sea Face', NULL, 'Mumbai', '400030',
 'Nisha Khanna', '+91 98765 20012',
 NULL, 'active', '2026-09-12', NULL,
 '2026-09-12 09:20:00', '2026-09-12 09:20:00'),

-- Junior member (DOB 2009-12-05, age 16 today); guardian on file
(7,  'CC-2026-007', '071829304152637485f90a1b2c3d4e56',
 19, 'Saanvi Desai',   '2009-12-05', '+91 98765 20019', 'saanvi.desai@example.com',
 '3, Napean Sea Road', NULL, 'Mumbai', '400006',
 'Nalini Desai', '+91 98765 30019',
 1, 'active', '2026-09-15', NULL,
 '2026-09-15 20:00:00', '2026-09-15 20:00:00'),

-- Signed up at front desk by Rohan (user 5)
(8,  'CC-2026-008', '1829304152637485960a1b2c3d4e5f67',
 21, 'Tanvi Pillai',   '2003-02-28', '+91 98765 20021', 'tanvi.pillai@example.com',
 '15, Colaba Causeway', NULL, 'Mumbai', '400005',
 'Suresh Pillai', '+91 98765 20013',
 NULL, 'active', '2026-09-22', 5,
 '2026-09-22 16:50:00', '2026-09-22 16:50:00'),

-- Self-signup online; referred by Kabir Khanna (CC-2026-006)
(9,  'CC-2026-009', '29304152637485960a1b2c3d4e5f6078',
 22, 'Arnav Kapoor',   '1990-07-12', '+91 98765 20022', 'arnav.kapoor@example.com',
 '9, Juhu Tara Road', NULL, 'Mumbai', '400049',
 'Sunita Kapoor', '+91 98765 20015',
 NULL, 'active', '2026-09-30', NULL,
 '2026-09-30 19:10:00', '2026-09-30 19:10:00');

-- ---------------------------------------------------------------------
-- 2.5  memberships  (9 rows — one active membership per member)
--      fee_charged and joining_fee_charged are SNAPSHOTS of the plan
--      price at the time of sign-up; later price changes do not alter them.
--      created_by: NULL = online self-service, 2 = Sunita (manager),
--                  4 = Priya (front desk), 5 = Rohan (front desk)
--      Ravi (member 1) has auto_renew = 1; all others default to 0.
--      Rahul (member 2) membership is 'active' even though his user
--      and member status are 'suspended' — the block is on access, not
--      the membership record itself.
-- ---------------------------------------------------------------------
INSERT INTO memberships
  (id, member_id, plan_id, start_date, end_date,
   status, started_as, previous_membership_id, auto_renew,
   fee_charged, joining_fee_charged,
   created_by, created_at, updated_at)
VALUES
-- Gold (plan_id = 1, 12-month, ₹7,999 + ₹1,999 joining)
(1, 1, 1, '2026-03-22', '2027-03-21', 'active', 'new', NULL, 1, 7999.00, 1999.00, 2,    '2026-03-22 18:00:00', '2026-03-22 18:00:00'),  -- Ravi
(2, 4, 1, '2026-09-05', '2027-09-04', 'active', 'new', NULL, 0, 7999.00, 1999.00, NULL, '2026-09-05 11:00:00', '2026-09-05 11:00:00'),  -- Vihaan
(3, 6, 1, '2026-09-12', '2027-09-11', 'active', 'new', NULL, 0, 7999.00, 1999.00, NULL, '2026-09-12 09:20:00', '2026-09-12 09:20:00'),  -- Kabir
(4, 9, 1, '2026-09-30', '2027-09-29', 'active', 'new', NULL, 0, 7999.00, 1999.00, NULL, '2026-09-30 19:10:00', '2026-09-30 19:10:00'),  -- Arnav
-- Silver (plan_id = 2, 6-month, ₹3,999 + ₹999 joining)
(5, 2, 2, '2026-07-20', '2027-01-19', 'active', 'new', NULL, 0, 3999.00,  999.00, 4,    '2026-07-20 10:05:00', '2026-07-20 10:05:00'),  -- Rahul  (suspended access)
(6, 3, 2, '2026-09-03', '2027-03-02', 'active', 'new', NULL, 0, 3999.00,  999.00, 4,    '2026-09-03 17:20:00', '2026-09-03 17:20:00'),  -- Ananya
(7, 5, 2, '2026-09-08', '2027-03-07', 'active', 'new', NULL, 0, 3999.00,  999.00, 5,    '2026-09-08 18:35:00', '2026-09-08 18:35:00'),  -- Ishita
(8, 8, 2, '2026-09-22', '2027-03-21', 'active', 'new', NULL, 0, 3999.00,  999.00, 5,    '2026-09-22 16:50:00', '2026-09-22 16:50:00'),  -- Tanvi
-- Junior (plan_id = 3, 12-month, ₹2,499 + ₹499 joining)
(9, 7, 3, '2026-09-15', '2027-09-14', 'active', 'new', NULL, 0, 2499.00,  499.00, NULL, '2026-09-15 20:00:00', '2026-09-15 20:00:00'); -- Saanvi

-- ---------------------------------------------------------------------
-- 2.6  guests  (7 rows)
--      Walk-ins, phone bookings and trial visitors.
--      guest 3 (Ishita Menon) has converted_member_id = 5 — she
--      attended a walk-in trial session on 7 Sep 2026 and enrolled
--      as a Silver member the next day. The guest record is kept for
--      the enquiry and conversion audit trail.
--      (Inserts AFTER members so the FK on converted_member_id resolves.)
-- ---------------------------------------------------------------------
INSERT INTO guests
  (id, full_name, phone, email, source, converted_member_id, notes, created_at)
VALUES
(1, 'Preethi Suresh',
 '+91 90000 30001', NULL,
 'walk_in', NULL,
 'Interested in tennis lessons; expressed interest in trying a Silver plan. Front desk to follow up.',
 '2026-09-10 14:30:00'),

(2, 'Karan Malhotra',
 '+91 90000 30002', 'karan.malhotra@gmail.com',
 'phone', NULL,
 'Called to book a padel court for a corporate team outing. Paid walk-in rate. May enquire about group packages.',
 '2026-09-15 11:00:00'),

-- Walk-in trial that converted to member id 5 (Ishita Menon)
(3, 'Ishita Menon',
 '+91 98765 20017', 'ishita.menon@example.com',
 'walk_in', 5,
 'Walk-in trial badminton session on 7 Sep 2026. Enrolled in Silver membership the following day (member CC-2026-005).',
 '2026-09-07 18:30:00'),

(4, 'Jatin Oberoi',
 '+91 90000 30003', 'jatin.oberoi@hotmail.com',
 'website', NULL,
 'Trial badminton session booked through the website on 19 Sep 2026. Attended on 20 Sep. Positive feedback — no conversion yet.',
 '2026-09-19 20:15:00'),

-- International walk-in; no phone on record
(5, 'Lisa Anderson',
 NULL, 'lisa.anderson@traveler.example',
 'walk_in', NULL,
 'International visitor. Played tennis on 2 Oct 2026. Paid walk-in rate in cash. No follow-up required.',
 '2026-10-02 10:00:00'),

(6, 'Devika Nair',
 '+91 90000 30005', NULL,
 'walk_in', NULL,
 'Accompanied Ananya Singh (CC-2026-003) for a social-play badminton session on 28 Sep. Not yet a member.',
 '2026-09-28 17:00:00'),

(7, 'Manav Soni',
 '+91 90000 30006', 'manav.soni@startup.example',
 'phone', NULL,
 'Called to enquire about a corporate package for 10 employees. Referred to Sunita Rao (Manager) for group pricing discussion.',
 '2026-10-01 09:30:00');

-- ---------------------------------------------------------------------
-- 2.7  business_clients  (4 rows)
--      Companies billed on account via formal invoices.
--      tax_id: dummy Maharashtra GSTINs (state code 27).
--      Client 2 (Bhatt & Associates) is the external accounting firm;
--      Meera Bhatt (user 13) is the primary contact for both the firm
--      and the club-side accountant login.
-- ---------------------------------------------------------------------
INSERT INTO business_clients
  (id, company_name, contact_person, email, phone,
   billing_address1, billing_address2, city, state, postal_code,
   tax_id, payment_terms_days, status, notes,
   created_at, updated_at)
VALUES
(1,
 'TechSoft Solutions Pvt Ltd', 'Ritesh Kumar',
 'ritesh.kumar@techsoft.example', '+91 22 4100 8888',
 'Unit 5B, BKC Tower', 'Bandra Kurla Complex', 'Mumbai', 'Maharashtra', '400051',
 '27AADCT5678G1ZX', 15, 'active',
 'Corporate account for 15 employee court bookings per month. Invoiced on the 1st of each month. Primary sport: tennis and padel.',
 '2026-04-10 10:00:00', '2026-04-10 10:00:00'),

(2,
 'Bhatt & Associates', 'Meera Bhatt',
 'accounts@bhattassociates.example', '+91 22 2500 6600',
 '802, Nariman House', 'Nariman Point', 'Mumbai', 'Maharashtra', '400021',
 '27AABFB9876H1ZP', 30, 'active',
 'External accountancy firm retained for annual tax filing and payroll audit. Contact is Meera Bhatt (also the club accountant login, user 13). Invoiced quarterly for advisory retainer.',
 '2026-04-01 11:00:00', '2026-04-01 11:00:00'),

(3,
 'Mumbai Premier Badminton League', 'Suresh Iyer',
 'suresh@mumbaipl.example', '+91 98100 77000',
 '12, Marine Drive Office Complex', NULL, 'Mumbai', 'Maharashtra', '400001',
 '27AACML4567J1ZT', 7, 'active',
 'Books all 4 badminton courts every Sunday 06:00-12:00 for league matches. Seasonal arrangement April-October. Single invoice per booking day; settled by UPI before the session starts.',
 '2026-04-05 09:00:00', '2026-09-01 10:00:00'),

(4,
 'FitCorp India Pvt Ltd', 'Prerna Kapoor',
 'prerna.kapoor@fitcorp.example', '+91 22 6800 5555',
 '3rd Floor, One Lower Parel', 'Senapati Bapat Marg', 'Mumbai', 'Maharashtra', '400013',
 '27AABCF2345K1ZM', 15, 'active',
 'Corporate wellness partner. Purchases 20 Silver memberships per quarter for rotating employee batches. 5% group discount approved by owner (Rajesh Malhotra, user 1). Next batch due Jan 2027.',
 '2026-06-15 14:00:00', '2026-06-15 14:00:00');

-- ---------------------------------------------------------------------
-- 2.8  member_notes  (8 rows)
--      Pinned notes appear at the top of the member profile.
--      created_by: 1 = Rajesh (owner), 2 = Sunita (manager),
--                  4 = Priya (front desk), 5 = Rohan (front desk)
-- ---------------------------------------------------------------------
INSERT INTO member_notes (id, member_id, note, is_pinned, created_by, created_at) VALUES

-- Pinned: suspension reason for Rahul (member 2)
(1, 2,
 'SUSPENSION REASON: Account suspended on 1 Sep 2026 by Rajesh Malhotra (Owner). '
 'Cause: non-payment of outstanding bar tab ₹3,200 (tab no. BAR-2026-088). '
 'Court bookings and shop orders blocked until full settlement is received and Sunita Rao (Manager) reinstates the account. '
 'Rahul contacted by phone on 1 Sep and 10 Sep 2026 — no response yet.',
 1, 1, '2026-09-01 12:30:00'),

-- Pinned: guardian consent for Saanvi (member 7, junior)
(2, 7,
 'JUNIOR MEMBER. Guardian consent form signed by Nalini Desai (Mother, +91 98765 30019) on 15 Sep 2026. '
 'Physical copy filed in the Junior Members folder under ref JR-2026-007. '
 'Saanvi must be accompanied by her guardian or a designated club coach for all court sessions until she turns 18 (5 Dec 2027).',
 1, 4, '2026-09-15 20:30:00'),

-- Note: Ravi dual-role account (member 1)
(3, 1,
 'Ravi holds a dual COACH + MEMBER account (user 12). His coaching schedule is managed in the HR module. '
 'His Gold membership gives him full self-service booking rights for personal practice. '
 'He prefers Court 4 (padel) on Saturday mornings 07:00-08:00. Do not reassign that standing slot without confirming with Sunita (Manager).',
 0, 2, '2026-03-22 18:30:00'),

-- Note: companion membership enquiry from Kabir (member 6)
(4, 6,
 'Kabir enquired on 15 Sep 2026 about adding a companion membership for his wife Nisha Khanna (+91 98765 20012). '
 'Directed him to Sunita Rao (Manager) for group pricing. Sunita to follow up before end of October 2026.',
 0, 4, '2026-09-15 15:00:00'),

-- Note: notification preference for Ananya (member 3)
(5, 3,
 'Member prefers SMS notifications over WhatsApp. Update her notification preference in the member app to SMS-only. '
 'She also asked to be notified when Friday evening social-play badminton sessions begin.',
 0, 5, '2026-09-03 18:00:00'),

-- Note: allergy alert for Vihaan (member 4)
(6, 4,
 'ALLERGY ALERT: Vihaan is allergic to natural latex. Offer only synthetic-grip or overgrip tape alternatives at the shop counter. '
 'Staff must note this when assisting him with equipment selection.',
 0, 4, '2026-09-05 12:00:00'),

-- Note: trial-to-membership conversion for Ishita (member 5)
(7, 5,
 'Ishita attended a walk-in trial badminton session on 7 Sep 2026 (guest record id 3). Very positive feedback. '
 'Enrolled in Silver membership the following day. Strong candidate for Gold upgrade at next renewal (Mar 2027). '
 'Rohan to send a personalised renewal offer 30 days before expiry.',
 0, 5, '2026-09-08 19:00:00'),

-- Note: referral note for Arnav (member 9)
(8, 9,
 'Arnav was referred by Kabir Khanna (CC-2026-006). Keen tennis player — has competed at state level. '
 'Interested in Friday social-play sessions. Priya introduced him to Ravi Shankar (coach, CC-2026-001) on 30 Sep for a technique assessment.',
 0, 4, '2026-09-30 20:00:00');

-- ==== DATA END ====


-- =====================================================================
-- 3) CHECK QUERIES  (run these to confirm the data loaded correctly)
-- =====================================================================

-- 3.1  Row counts.
--      Expected: membership_plans 3, plan_benefits 15, guardians 1,
--                members 9, memberships 9, guests 7,
--                business_clients 4, member_notes 8
SELECT 'membership_plans' AS tbl, COUNT(*) AS row_count FROM membership_plans
UNION ALL SELECT 'plan_benefits',   COUNT(*) FROM plan_benefits
UNION ALL SELECT 'guardians',       COUNT(*) FROM guardians
UNION ALL SELECT 'members',         COUNT(*) FROM members
UNION ALL SELECT 'memberships',     COUNT(*) FROM memberships
UNION ALL SELECT 'guests',          COUNT(*) FROM guests
UNION ALL SELECT 'business_clients',COUNT(*) FROM business_clients
UNION ALL SELECT 'member_notes',    COUNT(*) FROM member_notes;

-- 3.2  Plans with their benefit count and key pricing
SELECT p.id, p.code, p.name,
       CONCAT('₹', FORMAT(p.fee, 0))         AS monthly_fee,
       CONCAT('₹', FORMAT(p.joining_fee, 0)) AS joining_fee,
       p.duration_months,
       CONCAT(p.shop_discount_pct, '%')       AS shop_disc,
       CONCAT(p.bar_discount_pct,  '%')       AS bar_disc,
       p.max_age,
       COUNT(pb.id)                            AS benefit_count
FROM membership_plans p
LEFT JOIN plan_benefits pb ON pb.plan_id = p.id
GROUP BY p.id, p.code, p.name, p.fee, p.joining_fee,
         p.duration_months, p.shop_discount_pct, p.bar_discount_pct, p.max_age
ORDER BY p.sort_order;

-- 3.3  All members with their current plan and membership expiry
--      Users 3 and 12 (Arjun, Ravi) hold two roles each — Ravi appears
--      here as a member because he also holds the MEMBER role.
SELECT m.id, m.member_code, m.full_name,
       TIMESTAMPDIFF(YEAR, m.date_of_birth, CURDATE()) AS age,
       m.status            AS member_status,
       p.name              AS plan,
       ms.start_date, ms.end_date,
       DATEDIFF(ms.end_date, CURDATE())                AS days_to_expiry
FROM members m
JOIN memberships ms        ON ms.member_id = m.id AND ms.status = 'active'
JOIN membership_plans p    ON p.id = ms.plan_id
ORDER BY ms.end_date;

-- 3.4  The junior member and their guardian (should return 1 row)
SELECT m.member_code, m.full_name,
       TIMESTAMPDIFF(YEAR, m.date_of_birth, CURDATE()) AS age,
       m.date_of_birth,
       g.full_name   AS guardian_name,
       g.phone       AS guardian_phone,
       g.relationship
FROM members m
JOIN guardians g ON g.id = m.guardian_id;

-- 3.5  Members enrolled at the front desk vs. self-signup
SELECT u.full_name AS registered_by_staff,
       COUNT(m.id) AS member_count
FROM members m
LEFT JOIN users u ON u.id = m.registered_by
GROUP BY m.registered_by, u.full_name
ORDER BY member_count DESC;

-- 3.6  Suspended or left members — should flag Rahul (member 2)
SELECT m.id, m.member_code, m.full_name, m.status,
       ms.start_date, ms.end_date,
       p.name AS plan
FROM members m
JOIN memberships ms     ON ms.member_id = m.id AND ms.status = 'active'
JOIN membership_plans p ON p.id = ms.plan_id
WHERE m.status <> 'active';

-- 3.7  Pinned staff notes (should return 2 rows: Rahul and Saanvi)
SELECT mn.id, m.member_code, m.full_name,
       LEFT(mn.note, 80) AS note_preview,
       u.full_name       AS noted_by,
       mn.created_at
FROM member_notes mn
JOIN members m ON m.id = mn.member_id
JOIN users   u ON u.id = mn.created_by
WHERE mn.is_pinned = 1
ORDER BY mn.created_at;

-- 3.8  Guest-to-member conversions (converted_member_id IS NOT NULL)
--      Expected: 1 row — Ishita Menon (guest 3 → member 5)
SELECT g.id          AS guest_id,
       g.full_name   AS guest_name,
       g.source,
       g.created_at  AS visited_on,
       m.member_code,
       m.joined_on   AS joined_as_member
FROM guests g
JOIN members m ON m.id = g.converted_member_id;

-- 3.9  Business clients ordered by payment terms (tightest first)
SELECT id, company_name, contact_person, payment_terms_days,
       status
FROM business_clients
ORDER BY payment_terms_days, company_name;

-- 3.10 Full member profile view — join users, members, plan and notes count
SELECT u.id         AS user_id,
       m.member_code,
       u.full_name,
       u.email,
       u.status     AS login_status,
       m.status     AS member_status,
       p.name       AS plan,
       ms.end_date  AS membership_expires,
       COUNT(mn.id) AS note_count
FROM members m
JOIN users            u  ON u.id  = m.user_id
JOIN memberships      ms ON ms.member_id = m.id AND ms.status = 'active'
JOIN membership_plans p  ON p.id  = ms.plan_id
LEFT JOIN member_notes mn ON mn.member_id = m.id
GROUP BY u.id, m.member_code, u.full_name, u.email,
         u.status, m.status, p.name, ms.end_date
ORDER BY m.member_code;
