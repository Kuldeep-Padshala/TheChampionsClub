import api from '../api/client';
import {
  BarCategory,
  BarMenuItem,
  DiningTable,
  BarTab,
  BarOrder,
  BarStats,
} from '../types/bar.types';

export const barService = {
  // 1. Menu & Categories
  getCategories: async (): Promise<BarCategory[]> => {
    const res = await api.get('/bar/categories');
    return res.data.data;
  },

  getMenu: async (): Promise<BarMenuItem[]> => {
    const res = await api.get('/bar/menu');
    return res.data.data;
  },

  updateMenuAvailability: async (
    id: number,
    payload: { is_available?: number; price?: number }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/bar/menu/${id}`, payload);
    return res.data;
  },

  // 2. Dining Tables
  getTables: async (): Promise<DiningTable[]> => {
    const res = await api.get('/bar/tables');
    return res.data.data;
  },

  updateTableStatus: async (
    id: number,
    status: 'free' | 'occupied' | 'cleaning' | 'reserved'
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/bar/tables/${id}/status`, { status });
    return res.data;
  },

  // 3. Tabs
  getTabs: async (status: 'open' | 'settled' | 'all' = 'open'): Promise<BarTab[]> => {
    const res = await api.get(`/bar/tabs?status=${status}`);
    return res.data.data;
  },

  openTab: async (payload: {
    member_id?: number | null;
    guest_name?: string | null;
    table_id?: number | null;
  }): Promise<{ success: boolean; message: string; tabId: number; tabNo: string }> => {
    const res = await api.post('/bar/tabs', payload);
    return res.data;
  },

  settleTab: async (
    id: number,
    payload: { method?: 'cash' | 'card' | 'upi'; notes?: string }
  ): Promise<{
    success: boolean;
    message: string;
    totalAmount: number;
    invoiceId: number | null;
    receiptNo: string | null;
  }> => {
    const res = await api.post(`/bar/tabs/${id}/settle`, payload);
    return res.data;
  },

  // 4. Orders & Kitchen Display System
  getOrders: async (params?: { status?: string; date?: string }): Promise<BarOrder[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.date) query.append('date', params.date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/bar/orders${qs}`);
    return res.data.data;
  },

  createOrder: async (payload: {
    table_id?: number | null;
    tab_id?: number | null;
    member_id?: number | null;
    guest_name?: string | null;
    notes?: string | null;
    items: Array<{
      menu_item_id: number;
      quantity: number;
      special_instructions?: string;
    }>;
  }): Promise<{ success: boolean; message: string; orderId: number; orderNo: string; totalAmount: number }> => {
    const res = await api.post('/bar/orders', payload);
    return res.data;
  },

  updateOrderStatus: async (
    id: number,
    status: 'placed' | 'preparing' | 'ready' | 'served' | 'cancelled'
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/bar/orders/${id}/status`, { status });
    return res.data;
  },

  cancelOrder: async (
    id: number,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/bar/orders/${id}/cancel`, { reason });
    return res.data;
  },

  // 5. Direct Counter POS Checkout
  directCheckout: async (payload: {
    member_id?: number | null;
    guest_name?: string | null;
    payment_method: 'cash' | 'card' | 'upi';
    notes?: string;
    items: Array<{
      menu_item_id: number;
      quantity: number;
    }>;
  }): Promise<{
    success: boolean;
    message: string;
    orderId: number;
    orderNo: string;
    totalAmount: number;
    receiptNo: string;
  }> => {
    const res = await api.post('/bar/checkout', payload);
    return res.data;
  },

  // 6. Statistics
  getStats: async (): Promise<BarStats> => {
    const res = await api.get('/bar/stats');
    return res.data.data;
  },
};

export default barService;
