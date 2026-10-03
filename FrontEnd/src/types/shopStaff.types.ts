export interface ShopProductVariant {
  variant_id: number;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  price: number;
  stock_quantity: number;
  reorder_level?: number;
  product_id?: number;
  product_name?: string;
  category_name?: string;
  image_url?: string;
}

export interface ShopProduct {
  product_id: number;
  product_name: string;
  category: string;
  description?: string;
  image_url?: string;
  variants: ShopProductVariant[];
}

export interface CartItem {
  variant_id: number;
  product_name: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  stock_on_hand: number;
}

export interface OrderItemRecord {
  id: number;
  variant_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PendingPickupOrder {
  id: number;
  order_no: string;
  member_id?: number;
  channel: string;
  fulfillment_type: string;
  status: string;
  total_amount: number | string;
  subtotal: number | string;
  placed_at: string;
  ready_at?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  items?: OrderItemRecord[];
}

export interface ShopStats {
  todayOrders: number;
  todayRevenue: number;
  pendingPickups: number;
  lowStockItems: number;
  recentOrders: {
    id: number;
    order_no: string;
    total_amount: string | number;
    status: string;
    channel: string;
    placed_at: string;
    customer_name: string;
  }[];
}
