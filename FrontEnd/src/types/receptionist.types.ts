export interface Member {
  id: number;
  member_code: string;
  qr_token?: string;
  full_name: string;
  phone: string;
  email?: string;
  status: string;
  joined_on?: string;
  current_plan?: string;
  plan_expiry?: string;
  total_dues?: string | number;
}

export interface MemberProfile {
  id: number;
  member_code: string;
  qr_token?: string;
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  address_line1?: string;
  status: string;
  joined_on?: string;
}

export interface MemberActiveMembership {
  id: number;
  plan_id: number;
  plan_name: string;
  plan_code?: string;
  plan_fee?: string | number;
  start_date: string;
  end_date: string;
  status: string;
  fee_charged?: string | number;
}

export interface MemberBookingHistory {
  id: number;
  booking_ref: string;
  court_name: string;
  reservation_type: string;
  starts_at: string;
  ends_at: string;
  status: string;
  amount_charged: string | number;
}

export interface MemberCheckInHistory {
  id: number;
  method: string;
  checked_in_at: string;
  notes?: string;
}

export interface MemberDetail {
  profile: MemberProfile;
  active_memberships: MemberActiveMembership[];
  bookings: MemberBookingHistory[];
  checkIns: MemberCheckInHistory[];
  unpaid_invoices: Invoice[];
}

export interface Court {
  id: number;
  name: string;
  sport_id: number;
  surface: string;
  is_indoor: number;
  status: string;
  sport_name?: string;
}

export interface Reservation {
  reservation_id: number;
  court_id: number;
  starts_at: string;
  ends_at: string;
  reservation_type: string;
  reservation_status: string;
  booking_id?: number;
  booking_ref?: string;
  booking_status?: string;
  amount_charged?: string | number;
  notes?: string;
  member_id?: number;
  member_name?: string;
  member_phone?: string;
  member_code?: string;
}

export interface Invoice {
  id: number;
  invoice_no: string;
  member_id?: number;
  bill_to_name: string;
  total_amount: string | number;
  amount_paid?: string | number;
  balance_due: string | number;
  due_date?: string;
  issue_date?: string;
  status: string;
  member_phone?: string;
  member_code?: string;
}

export interface Enquiry {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  source: string;
  enquiry_type: string;
  message?: string;
  status: string;
  next_follow_up_at?: string;
  created_at: string;
  interested_plan?: string;
  interested_sport?: string;
  latest_note?: string;
}

export interface CheckInAlert {
  level: 'CRITICAL' | 'WARNING';
  message: string;
}

export interface CheckInResult {
  success: boolean;
  message: string;
  checkInId: number;
  checked_in_at: string;
  member: Member;
  membership: {
    planName: string;
    planExpiry?: string;
    isExpired: boolean;
    hasNoPlan: boolean;
    status: string;
  };
  billing: {
    hasUnpaidBills: boolean;
    totalUnpaid: number;
    unpaidInvoices: Invoice[];
  };
  alert: CheckInAlert | null;
}

export interface Sport {
  id: number;
  name: string;
}

export interface MembershipPlan {
  id: number;
  code: string;
  name: string;
  fee: string | number;
  duration_months: number;
  joining_fee?: string | number;
  description?: string;
}
