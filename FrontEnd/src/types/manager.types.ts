export interface ManagerCourt {
  id: number;
  name: string;
  sport_id: number;
  sport_name?: string;
  surface: string;
  is_indoor: number;
  status: string;
  notes: string | null;
}

export interface ManagerCourtRate {
  id: number;
  sport_id: number;
  sport_name: string;
  plan_id: number | null;
  plan_name: string | null;
  plan_code: string | null;
  price: string;
  is_active: number;
}

export interface ManagerInventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  brand: string;
  base_price: string;
  category_id: number;
  category_name?: string;
  sku: string;
  barcode: string | null;
  size: string | null;
  color: string | null;
  price_override: string | null;
  stock_on_hand: number;
  stock_reserved: number;
  reorder_level: number;
  is_active: number;
}

export interface ManagerStockMovement {
  id: number;
  variant_id: number;
  sku: string;
  size: string | null;
  product_name: string;
  quantity_change: number;
  reason: string;
  reference_type: string;
  balance_after: number;
  notes: string | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface ManagerBarItem {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string;
  price: string;
  is_available: number;
  is_active: number;
  image_url: string | null;
}

export interface ManagerInvoice {
  id: number;
  invoice_no: string;
  member_id: number | null;
  member_code: string | null;
  member_name: string | null;
  member_phone: string | null;
  bill_to_name: string | null;
  status: string;
  issue_date: string;
  due_date: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  notes: string | null;
  void_reason: string | null;
}

export interface ManagerEmployee {
  id: number;
  employee_code: string;
  full_name: string;
  user_full_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  phone: string | null;
  email: string | null;
  department: string;
  job_title: string;
  employment_type: string;
  hire_date: string;
  status: string;
}

export interface ManagerShift {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  job_title: string;
  department: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
}

export interface ManagerLeave {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  job_title: string;
  department: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days_requested: string;
  reason: string;
  status: string;
  decision_note: string | null;
  reviewer_name: string | null;
  requested_at: string;
}

export interface ManagerLeaveType {
  id: number;
  name: string;
  is_paid: number;
  annual_quota_days: string;
  is_active: number;
}

export interface ManagerDailyClosing {
  id: number;
  business_date: string;
  department: string;
  total_sales: string;
  cash_total: string;
  card_total: string;
  upi_total: string;
  online_total: string;
  opening_cash: string;
  expected_cash: string;
  counted_cash: string;
  cash_variance: string;
  closed_by_name: string | null;
  closed_at: string;
  notes: string | null;
}

export interface ManagerDailySummary {
  date: string;
  total_revenue: number;
  outstanding_dues: number;
  active_members: number;
  today_bookings: number;
  today_checkins: number;
  payment_breakdown: Array<{ payment_method: string; total: string; count: number }>;
  invoice_breakdown: Array<{ status: string; total: string; count: number }>;
}
