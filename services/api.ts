
import { AnalyticsData, Branch, Order, OrderStatus, OrderItem, User, ModificationRequest } from '../types';
import { MOCK_BRANCHES, MOCK_ORDERS, MOCK_USERS } from './mockData';

// Keys for LocalStorage
const KEY_USERS = 'rms_users';
const KEY_BRANCHES = 'rms_branches';
const KEY_ORDERS = 'rms_orders';

// Initialize data if empty
const initData = () => {
  if (!localStorage.getItem(KEY_USERS)) {
    localStorage.setItem(KEY_USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(KEY_BRANCHES)) {
    localStorage.setItem(KEY_BRANCHES, JSON.stringify(MOCK_BRANCHES));
  }
  if (!localStorage.getItem(KEY_ORDERS)) {
    localStorage.setItem(KEY_ORDERS, JSON.stringify(MOCK_ORDERS));
  }
};

initData();

// Helper to get data
const getStored = <T>(key: string): T => JSON.parse(localStorage.getItem(key) || '[]');
const setStored = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
  login: async (username: string): Promise<User | null> => {
    // Simulated delay
    await new Promise(r => setTimeout(r, 500));
    const users = getStored<User[]>(KEY_USERS);
    return users.find(u => u.username === username) || null;
  },

  getOrders: (branchId?: number): Order[] => {
    const orders = getStored<Order[]>(KEY_ORDERS);
    if (branchId) {
      return orders.filter(o => o.branch_id === branchId);
    }
    return orders;
  },

  updateOrderStatus: async (orderId: number, status: OrderStatus): Promise<Order> => {
    await new Promise(r => setTimeout(r, 300));
    const orders = getStored<Order[]>(KEY_ORDERS);
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const order = orders[index];
    order.status = status;
    const now = new Date().toISOString();

    if (status === OrderStatus.ACCEPTED) order.accepted_at = now;
    if (status === OrderStatus.IN_KITCHEN) order.in_kitchen_at = now;
    if (status === OrderStatus.OUT_FOR_DELIVERY) order.out_for_delivery_at = now;
    if (status === OrderStatus.DONE) order.done_at = now;

    orders[index] = order;
    setStored(KEY_ORDERS, orders);
    return order;
  },

  // New method for Cancellation with Reason
  cancelOrder: async (orderId: number, reason: string): Promise<Order> => {
    await new Promise(r => setTimeout(r, 300));
    const orders = getStored<Order[]>(KEY_ORDERS);
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const order = orders[index];
    order.status = OrderStatus.CANCELLED;
    order.cancellation_reason = reason;
    order.cancelled_at = new Date().toISOString();

    orders[index] = order;
    setStored(KEY_ORDERS, orders);
    return order;
  },

  // New method for Customer Alerts (Unusual Conditions)
  sendCustomerAlert: async (orderId: number, message: string): Promise<Order> => {
    await new Promise(r => setTimeout(r, 300));
    const orders = getStored<Order[]>(KEY_ORDERS);
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const order = orders[index];
    order.customer_alert_message = message;
    // In a real app, this would trigger a WhatsApp/SMS API call here

    orders[index] = order;
    setStored(KEY_ORDERS, orders);
    return order;
  },

  // --- Modification Flow (Agent/Kitchen Handshake) ---
  
  requestOrderModification: async (orderId: number, newItems: OrderItem[], newNotes: string): Promise<Order> => {
    await new Promise(r => setTimeout(r, 400));
    const orders = getStored<Order[]>(KEY_ORDERS);
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');
    
    const order = orders[index];
    
    if (order.status === OrderStatus.OUT_FOR_DELIVERY || order.status === OrderStatus.DONE) {
      throw new Error("Cannot modify order that is already out or done.");
    }

    // Set modification request
    order.modificationRequest = {
      items: newItems,
      notes: newNotes,
      requested_at: new Date().toISOString()
    };

    orders[index] = order;
    setStored(KEY_ORDERS, orders);
    return order;
  },

  resolveOrderModification: async (orderId: number, action: 'accept' | 'decline'): Promise<Order> => {
    await new Promise(r => setTimeout(r, 300));
    const orders = getStored<Order[]>(KEY_ORDERS);
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const order = orders[index];
    
    if (!order.modificationRequest) return order;

    if (action === 'accept') {
      // Apply changes
      order.items = order.modificationRequest.items;
      order.notes = order.modificationRequest.notes;
      
      // Recalculate totals
      const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      order.subtotal = subtotal;
      order.total_price = subtotal + order.delivery_fee;
    }

    // Clear request in both cases
    delete order.modificationRequest;

    orders[index] = order;
    setStored(KEY_ORDERS, orders);
    return order;
  },

  getBranches: (): Branch[] => {
    return getStored<Branch[]>(KEY_BRANCHES);
  },

  saveBranch: async (branch: Branch): Promise<void> => {
    await new Promise(r => setTimeout(r, 500));
    const branches = getStored<Branch[]>(KEY_BRANCHES);
    const index = branches.findIndex(b => b.id === branch.id);
    if (index >= 0) {
      branches[index] = branch;
    } else {
      branch.id = Date.now();
      branch.created_at = new Date().toISOString();
      branches.push(branch);
    }
    setStored(KEY_BRANCHES, branches);
  },

  generateDummyData: async (): Promise<void> => {
    const orders = getStored<Order[]>(KEY_ORDERS);
    const branches = getStored<Branch[]>(KEY_BRANCHES);
    
    // Find highest current ID to simulate sequence
    const maxId = orders.reduce((max, o) => (o.id > max ? o.id : max), 0);
    
    const sampleItems = [
      { name: 'Cheese Burger', price: 85 },
      { name: 'Pizza Pepperoni', price: 120 },
      { name: 'Cola', price: 15 },
      { name: 'French Fries', price: 30 },
      { name: 'Caesar Salad', price: 65 },
      { name: 'Chicken Wings', price: 90 }
    ];
    
    const newOrders = Array.from({ length: 5 }).map((_, i) => {
      const branch = branches[Math.floor(Math.random() * branches.length)];
      const itemsCount = Math.ceil(Math.random() * 3);
      const items = [];
      for(let j=0; j<itemsCount; j++) {
        const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
        items.push({ name: item.name, qty: Math.ceil(Math.random() * 2), price: item.price });
      }

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const delivery_fee = 15 + Math.floor(Math.random() * 20); // Random fee 15-35
      const total_price = subtotal + delivery_fee;
      
      // Random date in last 7 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      date.setHours(10 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60)); // Between 10am and 10pm

      // Random Status
      const statuses = Object.values(OrderStatus);
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      return {
          id: maxId + i + 1, // Short sequential ID
          branch_id: branch.id,
          customer_name: `Customer ${Math.floor(Math.random() * 1000)}`,
          customer_phone: `01${Math.floor(Math.random() * 100000000)}`,
          address_text: `Street ${Math.floor(Math.random() * 20)}, Building ${Math.floor(Math.random() * 50)}`,
          items,
          subtotal,
          delivery_fee,
          total_price,
          status: status,
          created_at: date.toISOString(),
          notes: Math.random() > 0.7 ? 'Spicy please' : undefined
      } as Order;
    });
    
    setStored(KEY_ORDERS, [...orders, ...newOrders]);
  },

  getAnalytics: async (startDate?: string, endDate?: string): Promise<AnalyticsData> => {
    await new Promise(r => setTimeout(r, 800));
    let orders = getStored<Order[]>(KEY_ORDERS);
    const branches = getStored<Branch[]>(KEY_BRANCHES);

    // Apply Date Range Filter if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      // Set end date to end of day if only date string is provided
      const end = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
      
      orders = orders.filter(o => {
        const oTime = new Date(o.created_at).getTime();
        return oTime >= start && oTime <= end;
      });
    }

    const validOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total_price, 0);
    const totalOrders = orders.length; // Count cancelled in total volume, but not revenue
    const avgOrderValue = totalOrders > 0 ? totalRevenue / validOrders.length : 0;
    
    // Mock avg time calculation
    const avgDeliveryTime = 35; 

    const revenuePerBranch = branches.map(b => {
      const branchOrders = validOrders.filter(o => o.branch_id === b.id);
      return {
        name: b.name.split(' - ')[0], // Simplify name for chart
        revenue: branchOrders.reduce((sum, o) => sum + o.total_price, 0)
      };
    });

    // Simplify hourly distribution for mock
    const ordersPerHour = [
      { hour: '10:00', count: validOrders.filter(o => new Date(o.created_at).getHours() === 10).length + 5 },
      { hour: '12:00', count: validOrders.filter(o => new Date(o.created_at).getHours() === 12).length + 15 },
      { hour: '14:00', count: validOrders.filter(o => new Date(o.created_at).getHours() === 14).length + 30 },
      { hour: '16:00', count: validOrders.filter(o => new Date(o.created_at).getHours() === 16).length + 20 },
      { hour: '18:00', count: validOrders.filter(o => new Date(o.created_at).getHours() === 18).length + 40 },
      { hour: '20:00', count: validOrders.filter(o => new Date(o.created_at).getHours() === 20).length + 25 },
    ];

    // Status Distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors: Record<string, string> = {
      [OrderStatus.DONE]: '#10B981', // Green
      [OrderStatus.CANCELLED]: '#EF4444', // Red
      [OrderStatus.PENDING]: '#F59E0B', // Yellow
      [OrderStatus.ACCEPTED]: '#3B82F6', // Blue
      [OrderStatus.IN_KITCHEN]: '#8B5CF6', // Purple
      [OrderStatus.OUT_FOR_DELIVERY]: '#6366F1', // Indigo
    };

    const ordersByStatus = Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status],
      color: statusColors[status] || '#9CA3AF'
    }));

    // Top Selling Items
    const itemSales: Record<string, { qty: number, revenue: number }> = {};
    validOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { qty: 0, revenue: 0 };
        }
        itemSales[item.name].qty += item.qty;
        itemSales[item.name].revenue += (item.qty * item.price);
      });
    });

    const topItems = Object.keys(itemSales)
      .map(name => ({
        name,
        sales: itemSales[name].qty,
        revenue: itemSales[name].revenue
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      avgDeliveryTime,
      avgOrderValue: isNaN(avgOrderValue) ? 0 : avgOrderValue,
      revenuePerBranch,
      ordersPerHour,
      ordersByStatus,
      topItems
    };
  }
};
