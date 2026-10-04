import api from '../api/client';
import {
  Member,
  MemberDetail,
  Court,
  Reservation,
  Invoice,
  Enquiry,
  CheckInResult,
  Sport,
  MembershipPlan,
} from '../types/receptionist.types';

export const receptionistService = {
  // 1. Members
  async getMembers(search?: string): Promise<Member[]> {
    const res = await api.get('/receptionist/members', { params: { search } });
    return res.data.data;
  },

  async registerMember(data: {
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth?: string;
    address_line1?: string;
    plan_id?: number;
  }): Promise<{ memberId: number; member_code: string; qr_token: string }> {
    const res = await api.post('/receptionist/members', data);
    return res.data;
  },

  async getMemberById(id: number | string): Promise<MemberDetail> {
    const res = await api.get(`/receptionist/members/${id}`);
    return res.data;
  },

  async sellMembership(data: {
    member_id: number;
    plan_id: number;
    start_date?: string;
    end_date?: string;
    fee_charged?: number;
    joining_fee_charged?: number;
  }): Promise<{ membershipId: number; invoiceId: number; invoice_no: string }> {
    const res = await api.post('/receptionist/memberships', data);
    return res.data;
  },

  // 2. Check-In (QR / Barcode / Manual)
  async checkIn(data: {
    member_id?: number;
    code?: string;
    booking_id?: number;
    method?: 'QR' | 'Barcode' | 'Manual';
  }): Promise<CheckInResult> {
    const res = await api.post('/receptionist/check-ins', data);
    return res.data;
  },

  // 3. Court Calendar & Bookings
  async getCourtAvailability(
    date: string,
    sport_id?: number
  ): Promise<{ courts: Court[]; reservations: Reservation[] }> {
    const res = await api.get('/receptionist/courts/availability', { params: { date, sport_id } });
    return { courts: res.data.courts, reservations: res.data.reservations };
  },

  async createBooking(data: {
    court_id: number;
    member_id?: number;
    guest_name?: string;
    guest_phone?: string;
    starts_at: string;
    ends_at: string;
    reservation_type: 'exclusive' | 'social';
    amount_charged?: number;
    notes?: string;
  }): Promise<{ bookingId: number; bookingRef: string; reservationId: number }> {
    const res = await api.post('/receptionist/bookings', data);
    return res.data;
  },

  async cancelBooking(id: number, cancellation_reason: string): Promise<void> {
    await api.post(`/receptionist/bookings/${id}/cancel`, { cancellation_reason });
  },

  // 4. Invoices & Billing
  async getInvoices(): Promise<Invoice[]> {
    const res = await api.get('/receptionist/invoices');
    return res.data.data;
  },

  async createInvoice(data: {
    member_id?: number;
    bill_to_name: string;
    subtotal: number;
    tax_total?: number;
    total_amount: number;
    due_date?: string;
    notes?: string;
  }): Promise<{ invoiceId: number; invoice_no: string }> {
    const res = await api.post('/receptionist/invoices', data);
    return res.data;
  },

  async recordPayment(data: {
    invoice_id: number;
    amount: number;
    method: 'Cash' | 'Card' | 'UPI' | 'Online';
    transaction_ref?: string;
    notes?: string;
  }): Promise<{ receipt_no: string; invoice_no: string; bill_to_name: string; amount: number; method: string; date: string }> {
    const res = await api.post('/receptionist/payments', data);
    return res.data;
  },

  // 5. Enquiries
  async getEnquiries(): Promise<Enquiry[]> {
    const res = await api.get('/receptionist/enquiries');
    return res.data.data;
  },

  async createEnquiry(data: {
    full_name: string;
    phone: string;
    email?: string;
    source?: string;
    enquiry_type?: string;
    message?: string;
    interested_plan_id?: number;
    interested_sport_id?: number;
  }): Promise<{ enquiryId: number }> {
    const res = await api.post('/receptionist/enquiries', data);
    return res.data;
  },

  async updateEnquiry(
    id: number,
    data: { status?: string; note_summary?: string; next_follow_up_at?: string }
  ): Promise<void> {
    await api.patch(`/receptionist/enquiries/${id}`, data);
  },

  // 6. Helpers
  async getSports(): Promise<Sport[]> {
    const res = await api.get('/receptionist/sports');
    return res.data.data;
  },

  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const res = await api.get('/receptionist/membership-plans');
    return res.data.data;
  },
};

export default receptionistService;
