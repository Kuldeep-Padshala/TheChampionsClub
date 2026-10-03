export interface RevenueBreakdown {
  memberships: number;
  courts: number;
  bar: number;
  shop: number;
}

export interface RevenueAnalytics {
  success: boolean;
  total_revenue: number;
  timeframe: 'day' | 'week' | 'month' | 'year';
  breakdown: RevenueBreakdown;
}

export interface CourtOccupancy {
  court_id: number;
  court_name: string;
  sport_name: string;
  surface: string;
  is_indoor: number;
  total_bookings: number;
  utilization_pct: string;
}

export interface GrowthAnalytics {
  new_members: number;
  churned_members: number;
  net_growth: number;
  active_members: number;
  growth_rate_pct: number;
}

export interface PendingPayroll {
  id: number;
  period_month: string;
  status: string;
  notes?: string;
  created_at: string;
  prepared_by_name?: string;
  total_amount: number | string;
  staff_count: number;
}

export interface PendingExpense {
  id: number;
  description: string;
  amount: number | string;
  tax_amount: number | string;
  total_payable: number | string;
  expense_date: string;
  due_date?: string;
  status: string;
  vendor_name?: string;
  reference_no?: string;
  category_name?: string;
  recorded_by_name?: string;
}

export interface PendingApprovalsData {
  payrolls: PendingPayroll[];
  expenses: PendingExpense[];
}

export interface OwnerMembershipPlan {
  id: number;
  code: string;
  name: string;
  description?: string;
  fee: number | string;
  duration_months: number;
  joining_fee: number | string;
  shop_discount_pct: number | string;
  bar_discount_pct: number | string;
  can_join_social_play: number;
  is_active: number;
  sort_order: number;
  created_at?: string;
  benefits?: string[];
}

export interface ReportShareItem {
  id: number;
  report_type: string;
  period_start: string;
  period_end: string;
  share_token: string;
  recipient_name?: string;
  recipient_email?: string;
  expires_at?: string;
  revoked_at?: string | null;
  view_count: number;
  created_at: string;
  created_by_name?: string;
}
