import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { Search, Filter, X, FileText, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const { t } = useI18n();

  // FIX: Load Data from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await api.getOrders(); // Fetch all orders (Admin)
        // Sort: Newest first
        const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(sorted);
      } catch (error) {
        console.error("Failed to load orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      (order.customer_phone || '').includes(searchTerm);

    // Filter logic:
    // 'active' = pending, accepted, in_kitchen, out_for_delivery (NOT done or cancelled)
    // 'all' = everything  
    // specific status = exact match
    const matchesStatus = filterStatus === 'active'
      ? !['done', 'cancelled'].includes(order.status)
      : filterStatus === 'all'
        ? true
        : order.status === filterStatus;

    let matchesDate = true;
    if (dateRange.start) {
      const start = new Date(dateRange.start).setHours(0, 0, 0, 0);
      if (new Date(order.created_at).getTime() < start) matchesDate = false;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).setHours(23, 59, 59, 999);
      if (new Date(order.created_at).getTime() > end) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: OrderStatus) => {
    const styles: any = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accepted': 'bg-blue-100 text-blue-800 border-blue-200',
      'in_kitchen': 'bg-purple-100 text-purple-800 border-purple-200',
      'out_for_delivery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'done': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100 border-gray-200'}`}>
        {t(`status.${status}`) || status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('nav.orders')}</h2>
              <p className="text-sm text-gray-500">View and manage all customer orders</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-bold text-gray-900">{filteredOrders.length}</span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('kds.search_placeholder')}
              className="w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Status Filter */}
            <div className="relative min-w-[160px]">
              <Filter className="absolute right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                className="w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm cursor-pointer hover:bg-white transition-colors"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="active">{t('filter.active')}</option>
                <option value="all">{t('kds.filter_all')}</option>
                <option value="done">{t('status.done')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
                <option value="pending">{t('status.pending')}</option>
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute -top-2 right-2 rtl:left-2 rtl:right-auto bg-white px-1 text-[10px] font-medium text-gray-500 rounded border border-gray-100 shadow-sm z-10">{t('filter.from_date')}</span>
                <input
                  type="date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2.5 outline-none shadow-sm h-[42px]"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <span className="text-gray-400">→</span>
              <div className="relative">
                <span className="absolute -top-2 right-2 rtl:left-2 rtl:right-auto bg-white px-1 text-[10px] font-medium text-gray-500 rounded border border-gray-100 shadow-sm z-10">{t('filter.to_date')}</span>
                <input
                  type="date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2.5 outline-none shadow-sm h-[42px]"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="p-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors border border-gray-200"
                  title={t('filter.reset')}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right rtl:text-right ltr:text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-6 py-4"># Order</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Customer Info</th>
              <th className="px-6 py-4">Address</th>
              <th className="px-6 py-4 text-center">Shipping</th>
              <th className="px-6 py-4 text-center">Total</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                </td>
              </tr>
            ) : filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-blue-50/50 transition duration-150 group">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  #{order.id}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString('en-US')}</span>
                    <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('en-US')}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-bold text-sm">{order.customer_name}</span>
                    <span className="text-gray-500 text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1" dir="ltr">{order.customer_phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm max-w-[250px] truncate" title={order.address_text}>
                  {order.address_text || '-'}
                </td>
                <td className="px-6 py-4 text-gray-700 text-sm font-mono text-center">
                  {order.delivery_fee} {t('common.currency')}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900 font-mono text-center text-base">
                  {order.total_price} {t('common.currency')}
                </td>
                <td className="px-6 py-4 text-center">
                  {getStatusBadge(order.status)}
                </td>
              </tr>
            ))}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-500 bg-gray-50/30">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-700">No orders found</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;