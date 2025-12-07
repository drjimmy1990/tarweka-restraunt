
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BRANCH_MANAGER = 'branch_manager'
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_KITCHEN = 'in_kitchen',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

export interface Zone {
  name: string;
  delivery_fee: number;
  polygon: [number, number][]; // Array of [lat, lon]
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
  branch_id?: number; // Optional: links manager to a branch
}

export interface Branch {
  id: number;
  manager_id?: number;
  name: string;
  phone_contact: string;
  zones: Zone[];
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface ModificationRequest {
  items: OrderItem[];
  notes?: string;
  requested_at: string;
}

export interface Order {
  id: number;
  branch_id: number;
  customer_name: string;
  customer_phone: string;
  address_text: string;
  items: OrderItem[];
  notes?: string;
  subtotal: number;
  delivery_fee: number;
  total_price: number;
  status: OrderStatus;
  
  // Timestamps
  created_at: string;
  accepted_at?: string;
  in_kitchen_at?: string;
  out_for_delivery_at?: string;
  done_at?: string;
  cancelled_at?: string;

  // Robustness / Exception Handling
  cancellation_reason?: string;
  customer_alert_message?: string; // For "unusual conditions" notifications
  
  // Modifications
  modificationRequest?: ModificationRequest;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgDeliveryTime: number; // in minutes
  avgOrderValue: number;
  revenuePerBranch: { name: string; revenue: number }[];
  ordersPerHour: { hour: string; count: number }[];
  ordersByStatus: { name: string; value: number; color: string }[];
  topItems: { name: string; sales: number; revenue: number }[];
}
