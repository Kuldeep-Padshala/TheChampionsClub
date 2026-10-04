import api from '../api/client';

export interface MemberProfile {
  id: number;
  user_id: number;
  member_code: string;
  qr_token: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  status: string;
  joined_on: string;
}

export interface MembershipPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  fee: string;
  duration_months: number;
  joining_fee: string;
  min_age: number | null;
  max_age: number | null;
  shop_discount_pct: string;
  bar_discount_pct: string;
  can_join_social_play: number;
  is_active: number;
  sort_order: number;
}

export interface ActiveMembership {
  id: number;
  plan_id: number;
  plan_name: string;
  plan_code: string;
  plan_description?: string;
  plan_fee: number;
  start_date: string;
  end_date: string;
  status: string;
}

export interface MemberCourtBooking {
  id: number;
  booking_ref: string;
  status: string;
  amount_charged: number;
  price_basis: string;
  notes: string | null;
  created_at: string;
  starts_at: string;
  ends_at: string;
  reservation_type: string;
  court_id: number;
  court_name: string;
  surface: string;
  is_indoor: number;
  sport_name: string;
}

export interface MemberInvoice {
  id: number;
  invoice_no: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  issue_date: string;
  due_date: string;
  status: string;
  notes: string | null;
}

export interface MemberShopProduct {
  id: number;
  name: string;
  brand: string;
  description: string;
  base_price: string;
  image_url: string | null;
  category_name: string | null;
}

export interface MemberShopOrder {
  id: number;
  order_no: string;
  channel: string;
  fulfillment_type: string;
  status: string;
  subtotal: number;
  total_amount: number;
  notes: string | null;
  placed_at: string;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

export interface MemberDashboardData {
  profile: MemberProfile;
  active_membership: ActiveMembership | null;
  total_dues: number;
  unpaid_invoices: MemberInvoice[];
  recent_checkins: Array<{ id: number; method: string; checked_in_at: string }>;
}

export const memberService = {
  // Profile
  getProfile: async (): Promise<MemberDashboardData> => {
    const res = await api.get('/members/me');
    return res.data;
  },

  updateProfile: async (data: Partial<MemberProfile>): Promise<{ profile: MemberProfile; message: string }> => {
    const res = await api.patch('/members/me', data);
    return res.data;
  },

  // Plans & Upgrades
  getMembershipPlans: async (): Promise<MembershipPlan[]> => {
    const res = await api.get('/members/plans');
    return res.data.data;
  },

  subscribeMembershipPlan: async (payload: { plan_id?: number; plan_code?: string; razorpay_payment_id?: string }): Promise<{
    success: boolean;
    message: string;
    active_membership: ActiveMembership;
  }> => {
    const res = await api.post('/members/plans/subscribe', payload);
    return res.data;
  },

  simulateStatus: async (status: 'gold' | 'expiring_soon' | 'inactive') => {
    const res = await api.post('/members/simulate-status', { status });
    return res.data;
  },

  // Courts & Bookings
  getCourtAvailability: async (date?: string, sportId?: string | number) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (sportId) params.append('sport_id', String(sportId));
    const res = await api.get(`/members/courts/availability?${params.toString()}`);
    return res.data;
  },

  getMyBookings: async (): Promise<MemberCourtBooking[]> => {
    const res = await api.get('/members/bookings/me');
    return res.data.data;
  },

  createBooking: async (payload: {
    court_id: number;
    starts_at: string;
    ends_at: string;
    reservation_type?: string;
    notes?: string;
    razorpay_payment_id?: string;
    amount_charged?: number;
  }) => {
    const res = await api.post('/members/bookings/me', payload);
    return res.data;
  },

  cancelBooking: async (bookingId: number) => {
    const res = await api.post(`/members/bookings/me/${bookingId}/cancel`);
    return res.data;
  },

  // Billing & Payments
  getMyInvoices: async (): Promise<MemberInvoice[]> => {
    const res = await api.get('/members/invoices/me');
    return res.data.data;
  },

  payOnline: async (payload: { invoice_id: number; amount: number; method?: string }) => {
    const res = await api.post('/members/payments/me/online', payload);
    return res.data;
  },

  // Shop & Orders
  getShopProducts: async (): Promise<MemberShopProduct[]> => {
    const res = await api.get('/members/shop/products');
    return res.data.data;
  },

  getMyOrders: async (): Promise<MemberShopOrder[]> => {
    const res = await api.get('/members/shop/orders/me');
    return res.data.data;
  },

  placeOrder: async (payload: {
    items: Array<{ product_name: string; quantity: number; unit_price: number; variant_id?: number }>;
    notes?: string;
  }) => {
    const res = await api.post('/members/shop/orders/me', payload);
    return res.data;
  },
};

export default memberService;
