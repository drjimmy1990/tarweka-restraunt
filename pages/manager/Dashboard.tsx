
import React, { useEffect, useState } from 'react';
import { User, Order, OrderStatus, OrderItem } from '../../types';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { Clock, MapPin, CheckCircle, Truck, PackageCheck, ChefHat, AlertCircle, Phone, Search, Filter, Eye, X, Calendar, MessageSquareWarning, Ban, RotateCcw, AlertTriangle, Pencil, Save, PlusCircle, Trash } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
  
  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showAlertModal, setShowAlertModal] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editNotes, setEditNotes] = useState('');

  const { t, language } = useI18n();

  // Poll for new orders (Simulating Realtime)
  useEffect(() => {
    const fetchOrders = () => {
      const allOrders = api.getOrders(user.branch_id);
      // Retrieve all valid orders, including DONE (we filter visually later)
      const branchOrders = allOrders.filter(o => o.status !== OrderStatus.CANCELLED)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setOrders(branchOrders);
      setLoading(false);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000); // 3 seconds polling
    return () => clearInterval(interval);
  }, [user.branch_id]);

  const handleStatusChange = async (orderId: number, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus;

    switch (currentStatus) {
      case OrderStatus.PENDING: nextStatus = OrderStatus.ACCEPTED; break;
      case OrderStatus.ACCEPTED: nextStatus = OrderStatus.IN_KITCHEN; break;
      case OrderStatus.IN_KITCHEN: nextStatus = OrderStatus.OUT_FOR_DELIVERY; break;
      case OrderStatus.OUT_FOR_DELIVERY: nextStatus = OrderStatus.DONE; break;
      case OrderStatus.DONE: nextStatus = OrderStatus.OUT_FOR_DELIVERY; break; // Undo action
      default: return;
    }

    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    
    // If viewing details modal, update it
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
    }
    
    await api.updateOrderStatus(orderId, nextStatus);
  };

  const handleCancelOrder = async () => {
    if (showCancelModal && cancelReason) {
      await api.cancelOrder(showCancelModal, cancelReason);
      setOrders(prev => prev.filter(o => o.id !== showCancelModal));
      if (selectedOrder?.id === showCancelModal) setSelectedOrder(null);
      setShowCancelModal(null);
      setCancelReason('');
    }
  };

  const handleSendAlert = async () => {
    if (showAlertModal && alertMessage) {
      await api.sendCustomerAlert(showAlertModal, alertMessage);
      const updatedOrder = await api.getOrders().find(o => o.id === showAlertModal);
      if(selectedOrder?.id === showAlertModal && updatedOrder) setSelectedOrder(updatedOrder);
      
      setShowAlertModal(null);
      setAlertMessage('');
    }
  };

  // Modification Logic
  const handleModificationResponse = async (orderId: number, action: 'accept' | 'decline') => {
    await api.resolveOrderModification(orderId, action);
    // Refresh local
    const updated = api.getOrders().find(o => o.id === orderId);
    if (updated) {
       setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
       if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    }
  };

  const handleStartEdit = () => {
    if (!selectedOrder) return;
    setEditItems([...selectedOrder.items]);
    setEditNotes(selectedOrder.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    try {
      await api.requestOrderModification(selectedOrder.id, editItems, editNotes);
      setIsEditing(false);
      // Force refresh to show the "Modification Pending" state immediately
      const updated = api.getOrders().find(o => o.id === selectedOrder.id);
      if (updated) {
         setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
         setSelectedOrder(updated); // Update modal view to latest
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case OrderStatus.ACCEPTED: return 'bg-blue-100 border-blue-300 text-blue-800';
      case OrderStatus.IN_KITCHEN: return 'bg-purple-100 border-purple-300 text-purple-800';
      case OrderStatus.OUT_FOR_DELIVERY: return 'bg-indigo-100 border-indigo-300 text-indigo-800';
      case OrderStatus.DONE: return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100';
    }
  };

  const getActionButton = (status: OrderStatus, orderId: number, fullWidth = true) => {
    const btnClass = `${fullWidth ? 'w-full' : 'px-6'} py-3 rounded-lg font-bold text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2`;
    
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <button onClick={() => handleStatusChange(orderId, status)} className={`${btnClass} bg-green-600 hover:bg-green-700`}>
            <CheckCircle className="w-5 h-5" /> {t('action.accept')}
          </button>
        );
      case OrderStatus.ACCEPTED:
        return (
          <button onClick={() => handleStatusChange(orderId, status)} className={`${btnClass} bg-blue-600 hover:bg-blue-700`}>
             <ChefHat className="w-5 h-5" /> {t('action.to_kitchen')}
          </button>
        );
      case OrderStatus.IN_KITCHEN:
        return (
          <button onClick={() => handleStatusChange(orderId, status)} className={`${btnClass} bg-purple-600 hover:bg-purple-700`}>
            <Truck className="w-5 h-5" /> {t('action.ready')}
          </button>
        );
      case OrderStatus.OUT_FOR_DELIVERY:
        return (
          <button onClick={() => handleStatusChange(orderId, status)} className={`${btnClass} bg-gray-600 hover:bg-gray-700`}>
            <PackageCheck className="w-5 h-5" /> {t('action.delivered')}
          </button>
        );
      case OrderStatus.DONE:
        return (
           <button onClick={() => handleStatusChange(orderId, status)} className={`${btnClass} bg-yellow-600 hover:bg-yellow-700`}>
             <RotateCcw className="w-5 h-5" /> {t('action.undo')}
           </button>
        );
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.id.toString().includes(searchTerm);
    
    const matchesStatus = filterStatus === 'ALL' 
      ? order.status !== OrderStatus.DONE 
      : order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const FilterButton = ({ status, label }: { status: OrderStatus | 'ALL', label: string }) => (
    <button
      onClick={() => setFilterStatus(status)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        filterStatus === status 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Controls Bar */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 right-3 rtl:right-auto rtl:left-3" />
          <input 
            type="text"
            placeholder={t('kds.search_placeholder')}
            className="w-full pl-4 pr-10 rtl:pr-4 rtl:pl-10 py-3 rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          <FilterButton status="ALL" label={t('kds.filter_all')} />
          <FilterButton status={OrderStatus.PENDING} label={t('status.pending')} />
          <FilterButton status={OrderStatus.ACCEPTED} label={t('status.accepted')} />
          <FilterButton status={OrderStatus.IN_KITCHEN} label={t('status.in_kitchen')} />
          <FilterButton status={OrderStatus.OUT_FOR_DELIVERY} label={t('status.out_for_delivery')} />
          <div className="w-px bg-gray-300 mx-1"></div>
          <FilterButton status={OrderStatus.DONE} label={t('kds.filter_done')} />
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <PackageCheck className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl">
             {filterStatus === OrderStatus.DONE ? 'No completed orders yet' : 'No active orders found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`relative bg-white rounded-xl shadow-lg border-2 overflow-hidden flex flex-col h-full transition-all hover:shadow-xl ${order.status === OrderStatus.PENDING ? 'border-yellow-400 animate-pulse-slow' : 'border-transparent'}`}>
              
              {/* MODIFICATION OVERLAY */}
              {order.modificationRequest && (
                <div className="absolute inset-0 z-20 bg-orange-500/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in">
                   <div className="bg-white/20 p-4 rounded-full mb-4 animate-bounce">
                      <AlertTriangle className="w-8 h-8 text-white" />
                   </div>
                   <h3 className="text-xl font-bold mb-2">{t('mod.alert')}</h3>
                   <p className="text-sm opacity-90 mb-6">Agent requested changes to items/notes.</p>
                   <div className="flex flex-col gap-3 w-full">
                      <button 
                        onClick={() => handleModificationResponse(order.id, 'accept')}
                        className="bg-white text-orange-600 py-3 rounded-lg font-bold hover:bg-gray-100 shadow-lg"
                      >
                         {t('mod.accept')}
                      </button>
                      <button 
                         onClick={() => handleModificationResponse(order.id, 'decline')}
                         className="bg-orange-700/50 text-white py-3 rounded-lg font-bold hover:bg-orange-700"
                      >
                         {t('mod.decline')}
                      </button>
                   </div>
                </div>
              )}

              {/* Header */}
              <div className={`px-4 py-3 flex justify-between items-center ${getStatusColor(order.status)}`}>
                <span className="font-bold text-lg">#{order.id}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(order.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <div className="flex gap-1">
                     <button 
                      onClick={() => setShowAlertModal(order.id)}
                      className="bg-yellow-500/20 hover:bg-yellow-500/40 p-1.5 rounded-full transition-colors text-yellow-800"
                      title={t('kds.send_alert')}
                    >
                      <MessageSquareWarning className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowCancelModal(order.id)}
                      className="bg-red-500/20 hover:bg-red-500/40 p-1.5 rounded-full transition-colors text-red-800"
                      title={t('kds.cancel_order')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsEditing(false); }}
                      className="bg-white/50 hover:bg-white/80 p-1.5 rounded-full transition-colors"
                      title={t('kds.details_title')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{order.customer_name}</h3>
                  <div className="flex items-center text-gray-600 text-sm gap-2 mb-1">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <p dir="ltr" className="font-mono">{order.customer_phone}</p>
                  </div>
                  <div className="flex items-start text-gray-500 text-sm gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{order.address_text}</p>
                  </div>
                </div>

                <div className="flex-1 bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                  <ul className="space-y-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2">
                          <span className="bg-white border border-gray-200 w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-gray-700">
                            {item.qty}x
                          </span>
                          <span className="text-gray-800 font-medium truncate max-w-[120px]">{item.name}</span>
                        </span>
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li className="text-xs text-center text-gray-400 pt-1">
                        + {order.items.length - 3} عناصر أخرى...
                      </li>
                    )}
                  </ul>
                  {order.notes && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-red-500 text-sm flex gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{order.notes}</span>
                    </div>
                  )}
                  {order.customer_alert_message && (
                    <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                       <span className="font-bold block mb-1">Alert Sent:</span>
                       {order.customer_alert_message}
                    </div>
                  )}
                </div>

                <div className="mb-4 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-gray-800 font-bold text-lg">
                    <span>{t('common.currency')} {order.total_price}</span>
                    <div className="text-sm font-normal text-gray-500 flex flex-col items-end">
                       <span className="text-xs">Sub: {order.subtotal}</span>
                       <span className="text-xs">+ Del: {order.delivery_fee}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  {getActionButton(order.status, order.id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal (Same as before) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                 <Ban className="w-8 h-8" />
                 <h2 className="text-xl font-bold">{t('kds.cancel_order')} #{showCancelModal}</h2>
              </div>
              <p className="text-gray-600 mb-4">Are you sure you want to cancel this order?</p>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder={t('kds.cancel_reason_placeholder')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                 <button onClick={() => setShowCancelModal(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">{t('kds.close')}</button>
                 <button onClick={handleCancelOrder} disabled={!cancelReason.trim()} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">{t('kds.confirm_cancel')}</button>
              </div>
           </div>
        </div>
      )}

      {/* Alert Modal (Same as before) */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
              <div className="flex items-center gap-3 text-yellow-600 mb-4">
                 <MessageSquareWarning className="w-8 h-8" />
                 <h2 className="text-xl font-bold">{t('kds.send_alert')} #{showAlertModal}</h2>
              </div>
              <p className="text-gray-600 mb-4">Send a message to the customer regarding an issue.</p>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-yellow-500"
                rows={3}
                placeholder={t('kds.alert_placeholder')}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                 <button onClick={() => setShowAlertModal(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">{t('kds.close')}</button>
                 <button onClick={handleSendAlert} disabled={!alertMessage.trim()} className="px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50">{t('kds.send')}</button>
              </div>
           </div>
        </div>
      )}

      {/* Order Details Modal (With Edit Mode) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-scale-in">
            {/* Modal Header */}
            <div className={`p-6 flex justify-between items-start ${getStatusColor(selectedOrder.status)}`}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold">#{selectedOrder.id}</h2>
                  <span className="bg-white/30 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                    {t(`status.${selectedOrder.status}`)}
                  </span>
                </div>
                <p className="opacity-80 text-sm">
                   {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                 {/* Only show Edit button if not done/cancelled and not already editing */}
                 {!isEditing && selectedOrder.status !== OrderStatus.DONE && selectedOrder.status !== OrderStatus.CANCELLED && (
                   <button 
                     onClick={handleStartEdit}
                     className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors text-inherit"
                     title="Modify Order (Agent)"
                   >
                     <Pencil className="w-6 h-6" />
                   </button>
                 )}
                 <button 
                   onClick={() => setSelectedOrder(null)}
                   className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors text-inherit"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {isEditing ? (
                 // EDIT MODE
                 <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                       <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                         <Pencil className="w-5 h-5" /> {t('mod.edit_mode')}
                       </h3>
                       <button 
                         onClick={() => {
                           const newItem: OrderItem = { name: "New Item", qty: 1, price: 50 };
                           setEditItems([...editItems, newItem]);
                         }}
                         className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 flex items-center gap-1"
                       >
                         <PlusCircle className="w-4 h-4" /> {t('mod.add_item')}
                       </button>
                    </div>

                    <div className="space-y-4 mb-6">
                       {editItems.map((item, idx) => (
                         <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <input 
                               type="number" min="1" 
                               value={item.qty}
                               onChange={(e) => {
                                  const newQty = parseInt(e.target.value) || 1;
                                  const newArr = [...editItems];
                                  newArr[idx].qty = newQty;
                                  setEditItems(newArr);
                               }}
                               className="w-16 p-2 border rounded text-center font-bold"
                            />
                            <div className="flex-1">
                               <input 
                                  type="text" 
                                  value={item.name}
                                  onChange={(e) => {
                                    const newArr = [...editItems];
                                    newArr[idx].name = e.target.value;
                                    setEditItems(newArr);
                                  }}
                                  className="w-full p-2 border rounded bg-white"
                               />
                            </div>
                            <button 
                               onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                               className="text-red-500 hover:bg-red-50 p-2 rounded"
                            >
                               <Trash className="w-4 h-4" />
                            </button>
                         </div>
                       ))}
                    </div>

                    <div className="mb-6">
                       <label className="block text-sm font-bold text-gray-700 mb-2">{t('mod.notes_label')}</label>
                       <textarea 
                          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                       />
                    </div>
                 </div>
              ) : (
                 // VIEW MODE
                 <div className="animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{t('kds.details_title')}</h3>
                         <div className="space-y-4">
                            <div>
                              <p className="text-gray-500 text-sm">Customer</p>
                              <p className="font-bold text-lg text-gray-800">{selectedOrder.customer_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Phone</p>
                              <p className="font-bold text-lg text-gray-800 font-mono" dir="ltr">{selectedOrder.customer_phone}</p>
                            </div>
                            <div>
                               <p className="text-gray-500 text-sm">Address</p>
                               <p className="font-medium text-gray-800">{selectedOrder.address_text}</p>
                            </div>
                         </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{t('kds.order_timeline')}</h3>
                        <div className="space-y-3 relative before:absolute before:right-[5px] rtl:before:right-[5px] ltr:before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                           {[
                             { label: 'Created', time: selectedOrder.created_at, active: true },
                             { label: 'Accepted', time: selectedOrder.accepted_at, active: !!selectedOrder.accepted_at },
                             { label: 'In Kitchen', time: selectedOrder.in_kitchen_at, active: !!selectedOrder.in_kitchen_at },
                             { label: 'Out for Delivery', time: selectedOrder.out_for_delivery_at, active: !!selectedOrder.out_for_delivery_at },
                             { label: 'Done', time: selectedOrder.done_at, active: !!selectedOrder.done_at },
                           ].map((step, idx) => (
                             <div key={idx} className="flex items-center gap-3 relative">
                               <div className={`w-3 h-3 rounded-full border-2 z-10 ${step.active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}></div>
                               <div className="flex-1">
                                 <p className={`text-sm font-bold ${step.active ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                                 {step.time && <p className="text-xs text-gray-500" dir="ltr">{new Date(step.time).toLocaleTimeString()}</p>}
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Order Items</h3>
                      <div className="space-y-3 mb-6">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                             <div className="flex items-center gap-3">
                                <span className="bg-white border border-gray-200 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-gray-700 shadow-sm">
                                  {item.qty}
                                </span>
                                <span className="font-bold text-gray-800">{item.name}</span>
                             </div>
                             <span className="font-mono font-medium text-gray-600">{item.price * item.qty} {t('common.currency')}</span>
                          </div>
                        ))}
                      </div>
                      
                      {selectedOrder.notes && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm mb-1">Kitchen Notes:</p>
                            <p>{selectedOrder.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                 </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
               {isEditing ? (
                  <>
                     <button 
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleSaveEdit}
                        className="px-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2"
                     >
                        <Save className="w-4 h-4" /> {t('mod.save_changes')}
                     </button>
                  </>
               ) : (
                  <>
                     <button 
                        onClick={() => setSelectedOrder(null)}
                        className="px-6 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        {t('kds.close')}
                      </button>
                     {selectedOrder.status !== OrderStatus.CANCELLED && (
                       <div className="w-48">
                         {getActionButton(selectedOrder.status, selectedOrder.id)}
                       </div>
                     )}
                  </>
               )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(250, 204, 21, 0); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
