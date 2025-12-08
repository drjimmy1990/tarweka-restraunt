import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AnalyticsData } from '../../types';
import { useI18n } from '../../i18n';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { DollarSign, ShoppingBag, Clock, TrendingUp, CreditCard, Package, Calendar, Search, RefreshCw, X, ChevronDown, Loader2 } from 'lucide-react';

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const { t } = useI18n();

  // FIX: Converted to Async/Await for better stability
  const fetchData = async (overrideStart?: string, overrideEnd?: string) => {
    setLoading(true);
    const start = overrideStart !== undefined ? overrideStart : dateRange.start;
    const end = overrideEnd !== undefined ? overrideEnd : dateRange.end;

    try {
      const result = await api.getAnalytics(start, end);
      setData(result);
    } catch (error) {
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyFilter = () => fetchData();

  const handleResetFilter = () => {
    setDateRange({ start: '', end: '' });
    setSelectedPreset('');
    fetchData('', '');
  };

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        setDateRange({ start: formatDate(today), end: formatDate(today) });
        fetchData(formatDate(today), formatDate(today));
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        setDateRange({ start: formatDate(start), end: formatDate(end) });
        fetchData(formatDate(start), formatDate(end));
        break;
      case 'last_week':
        start.setDate(today.getDate() - 7);
        setDateRange({ start: formatDate(start), end: formatDate(today) });
        fetchData(formatDate(start), formatDate(today));
        break;
      case 'last_month':
        start.setDate(today.getDate() - 30);
        setDateRange({ start: formatDate(start), end: formatDate(today) });
        fetchData(formatDate(start), formatDate(today));
        break;
      case 'last_year':
        start.setFullYear(today.getFullYear() - 1);
        setDateRange({ start: formatDate(start), end: formatDate(today) });
        fetchData(formatDate(start), formatDate(today));
        break;
      case 'all_time':
        setDateRange({ start: '', end: '' });
        fetchData('', '');
        break;
      default:
        break;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-gray-500">No Data Available</div>;

  const KPICard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-gray-800 font-bold text-lg w-full md:w-auto">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <span>{t('nav.analytics')}</span>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Quick Select Dropdown */}
          <div className="relative w-full md:w-48">
            <select
              className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none shadow-sm cursor-pointer"
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
            >
              <option value="" disabled>{t('filter.preset_placeholder')}</option>
              <option value="today">{t('filter.preset_today')}</option>
              <option value="yesterday">{t('filter.preset_yesterday')}</option>
              <option value="last_week">{t('filter.preset_last_week')}</option>
              <option value="last_month">{t('filter.preset_last_month')}</option>
              <option value="last_year">{t('filter.preset_last_year')}</option>
              <option value="all_time">{t('filter.preset_all_time')}</option>
            </select>
            <ChevronDown className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 flex-1 md:flex-initial w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <span className="absolute -top-2 right-2 rtl:left-2 rtl:right-auto bg-white px-1 text-[10px] font-medium text-gray-500 rounded border border-gray-100 shadow-sm z-10">{t('filter.from_date')}</span>
              <input
                type="date"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-36 px-3 py-2 outline-none shadow-sm"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setSelectedPreset('');
                }}
              />
            </div>
            <span className="text-gray-400 hidden md:inline">→</span>
            <div className="relative w-full md:w-auto">
              <span className="absolute -top-2 right-2 rtl:left-2 rtl:right-auto bg-white px-1 text-[10px] font-medium text-gray-500 rounded border border-gray-100 shadow-sm z-10">{t('filter.to_date')}</span>
              <input
                type="date"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-36 px-3 py-2 outline-none shadow-sm"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setSelectedPreset('');
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleApplyFilter}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md transition-all active:scale-95 whitespace-nowrap flex-1 md:flex-initial"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t('filter.apply')}
            </button>
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={handleResetFilter}
                className="bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 p-2.5 rounded-lg transition-colors border border-gray-200"
                title={t('filter.reset')}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t('analytics.revenue')}
          value={`${data.totalRevenue.toLocaleString()} ${t('common.currency')}`}
          icon={DollarSign}
          color="bg-green-600 text-green-600"
        />
        <KPICard
          title={t('analytics.orders')}
          value={data.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-600 text-blue-600"
        />
        <KPICard
          title={t('analytics.aov')}
          value={`${data.avgOrderValue.toFixed(0)} ${t('common.currency')}`}
          icon={CreditCard}
          color="bg-indigo-600 text-indigo-600"
        />
        <KPICard
          title={t('analytics.delivery_time')}
          value={`${data.avgDeliveryTime} ${t('common.minutes')}`}
          icon={Clock}
          color="bg-purple-600 text-purple-600"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart: Revenue & Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              {t('analytics.charts.peak_hours')}
            </h3>
          </div>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.ordersPerHour}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Package className="w-5 h-5 mr-2 text-indigo-500" />
            {t('analytics.charts.status_dist')}
          </h3>
          {data.ordersByStatus.length > 0 ? (
            <>
              <div className="h-64 w-full relative" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-3xl font-bold text-gray-800">{data.totalOrders}</span>
                    <span className="text-xs text-gray-400 uppercase">Orders</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {data.ordersByStatus.map(status => (
                  <div key={status.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: status.color }}></div>
                      <span className="text-gray-600">{t(`status.${status.name}`)}</span>
                    </div>
                    <span className="font-semibold">{status.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No data for selected period</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Top Products & Branch Perf */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-green-500" />
            {t('analytics.charts.top_items')}
          </h3>
          <div className="space-y-4">
            {data.topItems.length > 0 ? data.topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.sales} sold</p>
                  </div>
                </div>
                <div className="font-bold text-gray-700">
                  {item.revenue.toLocaleString()} {t('common.currency')}
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-400 py-8">No sales data for selected period</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
            {t('analytics.charts.revenue_branch')}
          </h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenuePerBranch} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} width={100} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;