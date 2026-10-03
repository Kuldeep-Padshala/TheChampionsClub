export interface BarCategory {
  id: number;
  name: string;
  sort_order: number;
  is_active: number;
}

export interface BarMenuItem {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string;
  price: string;
  tax_rate_id: number;
  station: string;
  is_available: number;
  is_active: number;
  image_url: string | null;
}

export interface DiningTable {
  id: number;
  table_number: string;
  seats: number;
  zone: string;
  status: 'free' | 'occupied' | 'cleaning' | 'reserved';
  active_tab_id?: number | null;
  tab_no?: string | null;
  guest_name?: string | null;
  member_name?: string | null;
}

export interface BarTab {
  id: number;
  tab_no: string;
  member_id: number | null;
  guest_id: number | null;
  guest_name: string | null;
  table_id: number | null;
  status: 'open' | 'settled' | 'void';
  opened_by: number;
  opened_at: string;
  settled_at: string | null;
  closed_by: number | null;
  table_number?: string | null;
  zone?: string | null;
  member_name?: string | null;
  member_code?: string | null;
  opened_by_name?: string | null;
  tab_total: string | number;
  order_count: number;
}

export interface BarOrderItem {
  id?: number;
  order_id?: number;
  menu_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  station?: string;
  kitchen_status?: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  special_instructions?: string | null;
  line_total?: string | number;
  menu_name?: string;
  image_url?: string | null;
}

export interface BarOrder {
  id: number;
  order_no: string;
  tab_id: number | null;
  table_id: number | null;
  member_id: number | null;
  guest_id: number | null;
  taken_by: number;
  status: 'placed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  member_discount_pct: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  total_amount: string;
  notes: string | null;
  placed_at: string;
  served_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  table_number?: string | null;
  zone?: string | null;
  tab_no?: string | null;
  guest_name?: string | null;
  member_name?: string | null;
  member_code?: string | null;
  taken_by_name?: string | null;
  items?: BarOrderItem[];
}

export interface BarStats {
  total_sales: number;
  total_orders: number;
  active_tabs: number;
  occupied_tables: number;
  pending_orders: number;
}
