export type OrderStatus = 'new' | 'kot-printed' | 'served';
export type TableStatus = 'vacant' | 'occupied' | 'reserved' | 'bill-pending';
export type PaymentMode = 'cash' | 'card' | 'upi';
export type BillFormat = 'kot' | 'customer' | 'ca' | 'restaurant';

export interface Restaurant {
  name: string;
  tagline: string;
  gstin: string;
  address: string;
  phone: string;
  gstRate: number;
}

export interface User {
  name: string;
  role: string;
  initials: string;
}

export interface Profile {
  restaurant: Restaurant;
  user: User;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  addons: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  linkedDishes: string[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  addons?: string[];
}

export interface Order {
  id: string;
  orderNo: string;
  table: string;
  time: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
}

export interface RestaurantTable {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  currentOrder?: string;
}

export interface HistoryRow {
  id: string;
  orderNo: string;
  table: string;
  date: string;
  time: string;
  status: 'completed' | 'cancelled';
  totalAmount: number;
  paymentMode: PaymentMode;
  items: number;
}

export interface OrderHistory {
  rows: HistoryRow[];
  summary: {
    totalOrders: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  };
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'negative';
  icon: 'clipboard' | 'users' | 'clock' | 'rupee';
}

export interface DashboardOrder {
  id: string;
  orderNo: string;
  table: string;
  items: number;
  placedAgo: string;
  status: OrderStatus;
}

export interface Dashboard {
  businessDate: string;
  businessTime: string;
  stats: DashboardStat[];
  latestOrders: DashboardOrder[];
}

export interface BillLine {
  name: string;
  quantity: number;
  addons: string[];
  unitPrice: number;
  amount: number;
}

export interface Bill {
  format: BillFormat;
  title: string;
  showPricing: boolean;
  orderNo: string;
  table: string;
  date: string;
  time: string;
  notes: string | null;
  lines: BillLine[];
  restaurant: Omit<Restaurant, 'gstRate'>;
  totals?: {
    subtotal: number;
    gst: number;
    cgst?: number;
    sgst?: number;
    total: number;
  };
  settlement?: { paymentMode: PaymentMode; server: string };
  footer?: string;
}
