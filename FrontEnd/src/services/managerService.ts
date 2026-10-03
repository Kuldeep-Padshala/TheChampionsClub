import api from '../api/client';
import {
  ManagerCourt,
  ManagerCourtRate,
  ManagerInventoryItem,
  ManagerStockMovement,
  ManagerBarItem,
  ManagerInvoice,
  ManagerEmployee,
  ManagerShift,
  ManagerLeave,
  ManagerLeaveType,
  ManagerDailyClosing,
  ManagerDailySummary,
} from '../types/manager.types';

export const managerService = {
  // 1. Operations & Configuration
  getCourts: async (): Promise<ManagerCourt[]> => {
    const res = await api.get('/manager/courts');
    return res.data.data;
  },

  updateCourt: async (id: number, status: string, notes?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/manager/courts/${id}`, { status, notes });
    return res.data;
  },

  getCourtRates: async (): Promise<ManagerCourtRate[]> => {
    const res = await api.get('/manager/court-rates');
    return res.data.data;
  },

  updateCourtRate: async (id: number, price: number, is_active?: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/manager/court-rates/${id}`, { price, is_active });
    return res.data;
  },

  getInventory: async (): Promise<ManagerInventoryItem[]> => {
    const res = await api.get('/manager/inventory');
    return res.data.data;
  },

  adjustInventory: async (payload: {
    variant_id: number;
    quantity_change: number;
    reason?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; previous_stock: number; new_stock: number }> => {
    const res = await api.post('/manager/inventory/adjust', payload);
    return res.data;
  },

  getStockMovements: async (): Promise<ManagerStockMovement[]> => {
    const res = await api.get('/manager/inventory/movements');
    return res.data.data;
  },

  getBarMenu: async (): Promise<ManagerBarItem[]> => {
    const res = await api.get('/manager/bar/menu');
    return res.data.data;
  },

  updateBarMenu: async (
    id: number,
    payload: { price?: number; is_available?: number; is_active?: number }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/manager/bar/menu/${id}`, payload);
    return res.data;
  },

  // 2. Overrides & Corrections ("The Boss Actions")
  forceBookCourt: async (payload: {
    court_id: number;
    member_id?: number | null;
    starts_at: string;
    ends_at: string;
    reservation_type?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; bookingId: number; bookingRef: string }> => {
    const res = await api.post('/manager/bookings/override', payload);
    return res.data;
  },

  getInvoices: async (): Promise<ManagerInvoice[]> => {
    const res = await api.get('/manager/invoices');
    return res.data.data;
  },

  voidInvoice: async (id: number, reason: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/manager/invoices/${id}/void`, { reason });
    return res.data;
  },

  // 3. Staff & Shifts (HR)
  getEmployees: async (): Promise<ManagerEmployee[]> => {
    const res = await api.get('/manager/employees');
    return res.data.data;
  },

  getShifts: async (): Promise<ManagerShift[]> => {
    const res = await api.get('/manager/shifts');
    return res.data.data;
  },

  createShift: async (payload: {
    employee_id: number;
    department?: string;
    starts_at: string;
    ends_at: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; shiftId: number }> => {
    const res = await api.post('/manager/shifts', payload);
    return res.data;
  },

  getLeaves: async (): Promise<ManagerLeave[]> => {
    const res = await api.get('/manager/leaves');
    return res.data.data;
  },

  getLeaveTypes: async (): Promise<ManagerLeaveType[]> => {
    const res = await api.get('/manager/leave-types');
    return res.data.data;
  },

  approveLeave: async (
    id: number,
    status: 'approved' | 'rejected',
    decision_note?: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/manager/leaves/${id}/approve`, { status, decision_note });
    return res.data;
  },

  // 4. Financial Reporting & End-of-Day
  getDailySummary: async (date?: string): Promise<ManagerDailySummary> => {
    const query = date ? `?date=${date}` : '';
    const res = await api.get(`/manager/reports/daily-summary${query}`);
    return res.data;
  },

  getDailyClosings: async (): Promise<ManagerDailyClosing[]> => {
    const res = await api.get('/manager/daily-closings');
    return res.data.data;
  },

  closeRegister: async (payload: {
    business_date?: string;
    department?: string;
    total_sales: number;
    cash_total: number;
    card_total: number;
    upi_total: number;
    online_total?: number;
    opening_cash?: number;
    expected_cash: number;
    counted_cash: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string; closingId: number; discrepancy: number }> => {
    const res = await api.post('/manager/daily-closings', payload);
    return res.data;
  },
};

export default managerService;
