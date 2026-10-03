-- =====================================================================
--  Champions Club : Staff & HR data (MySQL 8.0+)
--  Tables : employees, shift_templates, shifts, attendance_records,
--           leave_types, leave_requests, payroll_runs, payroll_items
--  Contents: dummy data only (no check queries)
-- =====================================================================

USE champions_club;

-- ==== DATA START ====

-- ---------------------------------------------------------------------
-- 1. employees (5 rows)
--    Links to users: Sunita (2), Priya (4), Imran (7), Neha (10)
--    Amit is a cleaner with no user login.
-- ---------------------------------------------------------------------
INSERT INTO employees
  (id, employee_code, user_id, full_name, phone, email, date_of_birth, address,
   emergency_contact_name, emergency_contact_phone, department, job_title, employment_type,
   hire_date, termination_date, status, reports_to_employee_id, pay_type,
   base_salary, hourly_rate, tax_id, bank_account_holder, bank_name, bank_account_number, bank_ifsc,
   notes, created_at, updated_at)
VALUES
(1, 'EMP-0001', 2, 'Sunita Rao',  '+91 98222 33344', 'sunita@example.com', '1985-11-20', 'Pune',
 'Ravi Rao', '+91 98222 55566', 'management', 'Club Manager', 'full_time',
 '2025-12-01', NULL, 'active', NULL, 'monthly_salary',
 60000.00, NULL, 'ABCDE1234F', 'Sunita Rao', 'HDFC Bank', '501001111', 'HDFC0001', NULL, '2025-11-25 10:00:00', '2025-11-25 10:00:00'),

(2, 'EMP-0002', 4, 'Priya Nair',  '+91 99887 76655', 'priya@example.com',  '1994-05-17', 'Pune',
 'Suresh Nair', '+91 98200 11122', 'front_desk', 'Front Desk Staff', 'full_time',
 '2026-01-15', NULL, 'active', 1, 'monthly_salary',
 30000.00, NULL, 'FGHIJ5678K', 'Priya Nair', 'SBI', '302002222', 'SBIN0002', NULL, '2026-01-10 11:00:00', '2026-01-10 11:00:00'),

(3, 'EMP-0003', 7, 'Imran Khan',  '+91 97777 88899', 'imran@example.com',  '1996-08-12', 'Pune',
 'Zoya Khan', '+91 97777 00011', 'bar', 'Bartender', 'part_time',
 '2026-02-01', NULL, 'active', 1, 'hourly',
 NULL, 150.00, 'KLMNO9012P', 'Imran Khan', 'ICICI Bank', '001103333', 'ICIC0003', NULL, '2026-01-25 14:00:00', '2026-01-25 14:00:00'),

(4, 'EMP-0004',10, 'Neha Sharma', '+91 96666 55544', 'neha@example.com',   '1998-03-25', 'Pune',
 'Rahul Sharma', '+91 96666 22233', 'shop', 'Shop Assistant', 'full_time',
 '2026-01-20', NULL, 'active', 1, 'monthly_salary',
 25000.00, NULL, 'PQRST3456U', 'Neha Sharma', 'Axis Bank', '912004444', 'UTIB0004', NULL, '2026-01-15 09:30:00', '2026-01-15 09:30:00'),

(5, 'EMP-0005',NULL,'Amit Patel', '+91 95555 44433', NULL,                 '1980-07-08', 'Pune',
 'Kiran Patel', '+91 95555 11122', 'maintenance', 'Cleaner', 'contract',
 '2026-01-01', NULL, 'active', 1, 'hourly',
 NULL, 100.00, 'UVWXY7890Z', 'Amit Patel', 'Bank of Baroda', '044005555', 'BARB0005', NULL, '2025-12-28 16:00:00', '2025-12-28 16:00:00');

-- ---------------------------------------------------------------------
-- 2. shift_templates (3 rows)
-- ---------------------------------------------------------------------
INSERT INTO shift_templates (id, name, department, start_time, end_time, is_active) VALUES
(1, 'Morning Opening', 'front_desk', '06:00:00', '14:00:00', 1),
(2, 'Evening Closing', 'front_desk', '14:00:00', '22:00:00', 1),
(3, 'Bar Evening',     'bar',        '16:00:00', '23:30:00', 1);

-- ---------------------------------------------------------------------
-- 3. shifts (5 rows)
-- ---------------------------------------------------------------------
INSERT INTO shifts
  (id, employee_id, department, template_id, starts_at, ends_at, status, notes, created_by, created_at)
VALUES
-- Oct 2 (Completed)
(1, 2, 'front_desk', 1, '2026-10-02 06:00:00', '2026-10-02 14:00:00', 'completed', NULL, 1, '2026-09-25 10:00:00'),
(2, 3, 'bar',        3, '2026-10-02 16:00:00', '2026-10-02 23:30:00', 'completed', NULL, 1, '2026-09-25 10:00:00'),
-- Oct 3 (Ongoing today)
(3, 2, 'front_desk', 1, '2026-10-03 06:00:00', '2026-10-03 14:00:00', 'completed', NULL, 1, '2026-09-25 10:00:00'),
(4, 3, 'bar',        3, '2026-10-03 16:00:00', '2026-10-03 23:30:00', 'scheduled', NULL, 1, '2026-09-25 10:00:00'),
(5, 5, 'maintenance',NULL,'2026-10-03 08:00:00', '2026-10-03 12:00:00', 'completed', 'Deep clean', 1, '2026-10-02 18:00:00');

-- ---------------------------------------------------------------------
-- 4. attendance_records (4 rows)
-- ---------------------------------------------------------------------
INSERT INTO attendance_records
  (id, employee_id, shift_id, clock_in, clock_out, method, notes, recorded_by)
VALUES
(1, 2, 1, '2026-10-02 05:55:00', '2026-10-02 14:05:00', 'biometric', NULL, NULL),
(2, 3, 2, '2026-10-02 15:50:00', '2026-10-02 23:45:00', 'biometric', 'Closed bar late', NULL),
(3, 2, 3, '2026-10-03 05:58:00', '2026-10-03 14:02:00', 'biometric', NULL, NULL),
(4, 5, 5, '2026-10-03 08:00:00', '2026-10-03 12:00:00', 'manual',    'Signed register', 2);

-- ---------------------------------------------------------------------
-- 5. leave_types (3 rows)
-- ---------------------------------------------------------------------
INSERT INTO leave_types (id, name, is_paid, annual_quota_days, is_active) VALUES
(1, 'Casual Leave', 1, 12.0, 1),
(2, 'Sick Leave',   1,  7.0, 1),
(3, 'Unpaid Leave', 0,  0.0, 1);

-- ---------------------------------------------------------------------
-- 6. leave_requests (1 row)
-- ---------------------------------------------------------------------
INSERT INTO leave_requests
  (id, employee_id, leave_type_id, start_date, end_date, days_requested, reason,
   status, requested_at, decided_by, decided_at, decision_note, updated_at)
VALUES
(1, 2, 2, '2026-09-15', '2026-09-16', 2.0, 'Viral fever',
 'approved', '2026-09-14 09:00:00', 1, '2026-09-14 10:30:00', 'Approved, get well soon. Rohan covering shift.', '2026-09-14 10:30:00');

-- ---------------------------------------------------------------------
-- 7. payroll_runs (1 row)
--    September 2026 payroll (Processed and paid on Oct 1)
-- ---------------------------------------------------------------------
INSERT INTO payroll_runs
  (id, period_month, status, created_by, approved_by, approved_at, paid_at, notes, created_at)
VALUES
(1, '2026-09-01', 'paid', 2, 1, '2026-10-01 10:00:00', '2026-10-01 14:00:00', 'September 2026 Salaries', '2026-10-01 09:00:00');

-- ---------------------------------------------------------------------
-- 8. payroll_items (5 rows)
--    Net Pay = (Base + Overtime + Allowances) - (Unpaid Leave + Tax + Other Deductions)
-- ---------------------------------------------------------------------
INSERT INTO payroll_items
  (id, payroll_run_id, employee_id, days_worked, hours_worked, unpaid_leave_days,
   base_pay, overtime_pay, allowances, gross_pay, unpaid_leave_deduction, tax_deducted, other_deductions, net_pay,
   payment_status, paid_at, payment_method, payment_reference)
VALUES
-- Sunita (Manager, Salaried)
(1, 1, 1, 26.0, 208.00, 0.0, 60000.00,    0.00, 2000.00, 62000.00, 0.00, 3000.00, 0.00, 59000.00, 'paid', '2026-10-01 14:00:00', 'bank_transfer', 'UTR-SEP-001'),
-- Priya (Front Desk, Salaried - 2 sick days are paid)
(2, 1, 2, 24.0, 192.00, 0.0, 30000.00,    0.00, 1000.00, 31000.00, 0.00,  500.00, 0.00, 30500.00, 'paid', '2026-10-01 14:00:00', 'bank_transfer', 'UTR-SEP-002'),
-- Imran (Bar, Hourly: 120 hrs * 150 = 18000)
(3, 1, 3, 20.0, 120.00, 0.0, 18000.00, 1500.00,    0.00, 19500.00, 0.00,    0.00, 0.00, 19500.00, 'paid', '2026-10-01 14:00:00', 'bank_transfer', 'UTR-SEP-003'),
-- Neha (Shop, Salaried)
(4, 1, 4, 26.0, 208.00, 0.0, 25000.00,    0.00,  500.00, 25500.00, 0.00,    0.00, 0.00, 25500.00, 'paid', '2026-10-01 14:00:00', 'bank_transfer', 'UTR-SEP-004'),
-- Amit (Cleaner, Hourly: 80 hrs * 100 = 8000)
(5, 1, 5, 20.0,  80.00, 0.0,  8000.00,  500.00,    0.00,  8500.00, 0.00,    0.00, 0.00,  8500.00, 'paid', '2026-10-01 14:00:00', 'cash',          'CASH-SEP-005');

-- ==== DATA END ====
