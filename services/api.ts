import { supabase } from '../lib/supabase';
import { AnalyticsData, Branch, Order, OrderStatus, User, UserRole } from '../types';

export const api = {
  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------
  login: async (email: string, password: string): Promise<User | null> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Login Failed:', authError?.message);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile Fetch Failed:', profileError?.message);
      return null;
    }

    return {
      id: profile.id,
      username: profile.username || email,
      role: profile.role as UserRole,
      full_name: profile.full_name,
      branch_id: profile.branch_id
    } as unknown as User;
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  // ----------------------------------------------------
  // ORDERS
  // ----------------------------------------------------
  getOrders: async (branchId?: number): Promise<Order[]> => {
    let query = supabase
      .from('orders')
      .select('*, customers(full_name, phone_number), customer_addresses(address_text, latitude, longitude)')
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    // Map the joined data to flat Order structure
    return data.map((order: any) => ({
      ...order,
      customer_name: order.customers?.full_name || 'App Customer',
      customer_phone: order.customers?.phone_number || 'N/A',
      address_text: order.customer_addresses?.address_text || 'Pick Up',
      customer_lat: order.customer_addresses?.latitude,
      customer_lng: order.customer_addresses?.longitude
    })) as Order[];
  },

  updateOrderStatus: async (orderId: number, status: OrderStatus): Promise<void> => {
    const updateData: any = { status };
    const now = new Date().toISOString();

    if (status === 'accepted') updateData.accepted_at = now;
    if (status === 'in_kitchen') updateData.in_kitchen_at = now;
    if (status === 'out_for_delivery') updateData.out_for_delivery_at = now;
    if (status === 'done') updateData.done_at = now;

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;
  },

  cancelOrder: async (orderId: number, reason: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  dismissCancelledOrder: async (orderId: number): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ cancellation_dismissed: true })
      .eq('id', orderId);

    if (error) throw error;
  },

  sendCustomerAlert: async (orderId: number, message: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ customer_alert_message: message })
      .eq('id', orderId);

    if (error) throw error;
  },

  // ----------------------------------------------------
  // REQUEST MODIFICATIONS (Agent/Kitchen Workflow)
  // ----------------------------------------------------
  requestOrderModification: async (orderId: number, newItems: any[], newNotes: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({
        modification_pending: true, // <--- CRITICAL: Set Flag to TRUE
        modification_request: {
          items: newItems,
          notes: newNotes,
          requested_at: new Date().toISOString()
        }
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  resolveOrderModification: async (orderId: number, action: 'accept' | 'decline'): Promise<void> => {
    // 1. If Declined: Just clear the request and turn off the flag
    if (action === 'decline') {
      const { error } = await supabase
        .from('orders')
        .update({
          modification_request: null,
          modification_pending: false // <--- CRITICAL: Set Flag to FALSE
        })
        .eq('id', orderId);
      if (error) throw error;
      return;
    }

    // 2. If Accepted: Apply changes AND turn off the flag
    const { data: order } = await supabase.from('orders').select('modification_request').eq('id', orderId).single();

    if (!order || !order.modification_request) return;

    const newItems = order.modification_request.items;
    const newNotes = order.modification_request.notes;

    // Recalculate Totals
    const subtotal = newItems.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
    // Note: total_price is generated by DB usually, but we update subtotal

    const { error } = await supabase
      .from('orders')
      .update({
        items: newItems,
        kitchen_notes: newNotes,
        subtotal: subtotal,
        modification_request: null, // Clear JSON
        modification_pending: false // <--- CRITICAL: Set Flag to FALSE
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  // ----------------------------------------------------
  // BRANCHES
  // ----------------------------------------------------
  getBranches: async (): Promise<Branch[]> => {
    const { data, error } = await supabase.from('branches').select('*');
    if (error) return [];
    return data as Branch[];
  },

  saveBranch: async (branch: Partial<Branch>): Promise<void> => {
    if (branch.id && branch.id !== 0) {
      const { error } = await supabase
        .from('branches')
        .update({
          name: branch.name,
          phone_contact: branch.phone_contact,
          zones: branch.zones,
          is_active: branch.is_active
        })
        .eq('id', branch.id);
      if (error) throw error;
    } else {
      const { id, ...newBranch } = branch;
      const { error } = await supabase.from('branches').insert(newBranch);
      if (error) throw error;
    }
  },

  // ----------------------------------------------------
  // ANALYTICS
  // ----------------------------------------------------
  getAnalytics: async (startDate?: string, endDate?: string): Promise<AnalyticsData> => {
    let query = supabase.from('orders').select('*');

    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

    const { data: orders, error } = await query;
    if (error || !orders) return {
      totalRevenue: 0, totalOrders: 0, avgDeliveryTime: 0, avgOrderValue: 0,
      revenuePerBranch: [], ordersPerHour: [], ordersByStatus: [], topItems: []
    };

    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / validOrders.length : 0;

    return {
      totalRevenue,
      totalOrders,
      avgDeliveryTime: 30,
      avgOrderValue,
      revenuePerBranch: [],
      ordersPerHour: [],
      ordersByStatus: [
        { name: 'done', value: orders.filter(o => o.status === 'done').length, color: '#10B981' },
        { name: 'cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#EF4444' }
      ],
      topItems: []
    };
  }
};