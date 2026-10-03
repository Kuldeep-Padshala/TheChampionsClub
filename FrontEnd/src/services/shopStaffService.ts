import api from '../api/client';
import {
  ShopProduct,
  ShopProductVariant,
  PendingPickupOrder,
  ShopStats
} from '../types/shopStaff.types';

export const shopStaffService = {
  async getCatalog(): Promise<{ catalog: ShopProduct[]; flatVariants: ShopProductVariant[] }> {
    const res = await api.get('/shop/catalog');
    return {
      catalog: res.data.data || [],
      flatVariants: res.data.flatVariants || [],
    };
  },

  async getVariantBySku(sku: string): Promise<ShopProductVariant> {
    const res = await api.get(`/shop/variants/sku/${encodeURIComponent(sku)}`);
    return res.data.data;
  },

  async processInStoreSale(data: {
    member_id?: number | null;
    items: { variant_id: number; quantity: number }[];
    payment_method: string;
    discount_pct?: number;
  }): Promise<{
    orderId: number;
    orderNo: string;
    invoiceNo: string;
    receiptNo: string;
    totalAmount: number;
    subtotal: number;
    discountAmount: number;
    paymentMethod: string;
  }> {
    const res = await api.post('/shop/orders', data);
    return res.data.data;
  },

  async getPendingPickups(): Promise<PendingPickupOrder[]> {
    const res = await api.get('/shop/orders/pending-pickup');
    return res.data.data || [];
  },

  async fulfillOrder(orderId: number): Promise<{ message: string }> {
    const res = await api.patch(`/shop/orders/${orderId}/fulfill`);
    return res.data;
  },

  async processReturn(orderId: number, data: { item_ids?: number[]; reason?: string }): Promise<{
    message: string;
    refund_amount: number;
    items_returned: number;
  }> {
    const res = await api.post(`/shop/orders/${orderId}/return`, data);
    return res.data;
  },

  async getStats(): Promise<ShopStats> {
    const res = await api.get('/shop/stats');
    return res.data.data;
  },
};
