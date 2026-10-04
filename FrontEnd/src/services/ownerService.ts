import api from '../api/client';
import {
  RevenueAnalytics,
  CourtOccupancy,
  GrowthAnalytics,
  PendingApprovalsData,
  OwnerMembershipPlan,
  ReportShareItem
} from '../types/owner.types';

export const ownerService = {
  async getRevenueAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<RevenueAnalytics> {
    const res = await api.get('/owner/analytics/revenue', { params: { timeframe } });
    return res.data;
  },

  async getOccupancyAnalytics(): Promise<CourtOccupancy[]> {
    const res = await api.get('/owner/analytics/occupancy');
    return res.data.data || [];
  },

  async getGrowthAnalytics(): Promise<GrowthAnalytics> {
    const res = await api.get('/owner/analytics/growth');
    return res.data.data;
  },

  async getPendingApprovals(): Promise<PendingApprovalsData> {
    const res = await api.get('/owner/approvals/pending');
    return res.data.data || { payrolls: [], expenses: [] };
  },

  async authorizePayroll(id: number): Promise<{ message: string }> {
    const res = await api.patch(`/owner/payroll/${id}/approve`);
    return res.data;
  },

  async authorizeExpense(id: number, data?: { payment_method?: string; reference_no?: string }): Promise<{ message: string }> {
    const res = await api.patch(`/owner/expenses/${id}/approve`, data || {});
    return res.data;
  },

  async getMembershipPlans(): Promise<OwnerMembershipPlan[]> {
    const res = await api.get('/owner/membership-plans');
    return res.data.data || [];
  },

  async createMembershipPlan(data: {
    code?: string;
    name: string;
    description?: string;
    duration_months?: number;
    fee: number;
    joining_fee?: number;
    shop_discount_pct?: number;
    bar_discount_pct?: number;
    benefits?: string[];
  }): Promise<{ message: string; planId: number }> {
    const res = await api.post('/owner/membership-plans', data);
    return res.data;
  },

  async manageDiscounts(target: string, discount_percent: number): Promise<{ message: string }> {
    const res = await api.patch('/owner/discounts', { target, discount_percent });
    return res.data;
  },

  async getReportShares(): Promise<ReportShareItem[]> {
    const res = await api.get('/owner/reports/shares');
    return res.data.data || [];
  },

  async generateReportShare(data: {
    report_type: string;
    recipient_name?: string;
    recipient_email?: string;
    period_start?: string;
    period_end?: string;
  }): Promise<{ message: string; share_token: string; secure_link: string; expires_in: string }> {
    const res = await api.post('/owner/reports/share', data);
    return res.data;
  }
};
