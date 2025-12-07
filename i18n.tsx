
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface I18nContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'app.title': 'إدارة المطاعم',
    'app.subtitle': 'نظام رقمي متكامل',
    'nav.main_menu': 'القائمة الرئيسية',
    'nav.testing': 'اختبار',
    'nav.dashboard': 'شاشة المطبخ (KDS)',
    'nav.analytics': 'لوحة التحليلات',
    'nav.branches': 'إدارة الفروع',
    'nav.orders': 'سجل الطلبات',
    'nav.history': 'الطلبات المكتملة',
    'user.manager': 'مدير فرع',
    'user.admin': 'مسؤول النظام',
    'logout': 'تسجيل الخروج',
    'login.title': 'تسجيل الدخول',
    'login.subtitle': 'نظام إدارة المطاعم الذكي',
    'login.username': 'اسم المستخدم',
    'login.button': 'دخول للنظام',
    'login.loading': 'جاري التحقق...',
    'login.error': 'اسم المستخدم غير صحيح',
    'analytics.revenue': 'إجمالي الإيرادات',
    'analytics.orders': 'عدد الطلبات',
    'analytics.delivery_time': 'متوسط زمن التوصيل',
    'analytics.aov': 'متوسط قيمة الطلب',
    'analytics.charts.revenue_branch': 'الإيرادات حسب الفرع',
    'analytics.charts.peak_hours': 'ذروة الطلبات (بالساعة)',
    'analytics.charts.status_dist': 'توزيع حالات الطلبات',
    'analytics.charts.top_items': 'المنتجات الأكثر مبيعاً',
    'common.currency': 'ج.م',
    'common.minutes': 'دقيقة',
    'common.loading': 'جاري التحميل...',
    'status.pending': 'قيد الانتظار',
    'status.accepted': 'مقبول',
    'status.in_kitchen': 'في المطبخ',
    'status.out_for_delivery': 'جاري التوصيل',
    'status.done': 'مكتمل',
    'status.cancelled': 'ملغي',
    'action.accept': 'قبول الطلب',
    'action.to_kitchen': 'تحويل للمطبخ',
    'action.ready': 'جاهز للتوصيل',
    'action.delivered': 'تم التوصيل (إخفاء)',
    'action.undo': 'تراجع عن الإكمال',
    'debug.generate_data': 'توليد بيانات اختبار',
    'debug.data_added': 'تمت إضافة بيانات عشوائية!',
    'kds.search_placeholder': 'بحث برقم الطلب، الاسم، أو الهاتف...',
    'kds.filter_all': 'نشط',
    'kds.filter_done': 'المكتملة',
    'kds.details_title': 'تفاصيل الطلب',
    'kds.order_timeline': 'سجل الحالة',
    'kds.close': 'إغلاق',
    'kds.cancel_order': 'إلغاء الطلب',
    'kds.cancel_reason_placeholder': 'سبب الإلغاء (مثال: العميل لم يرد، نفاد الكمية...)',
    'kds.confirm_cancel': 'تأكيد الإلغاء',
    'kds.send_alert': 'إبلاغ العميل بمشكلة',
    'kds.alert_placeholder': 'رسالة للعميل (مثال: الطلب سيتأخر 15 دقيقة بسبب المطر...)',
    'kds.send': 'إرسال',
    'filter.from_date': 'من تاريخ',
    'filter.to_date': 'إلى تاريخ',
    'filter.apply': 'تطبيق الفلتر',
    'filter.reset': 'إعادة تعيين',
    'filter.preset_placeholder': 'اختر الفترة',
    'filter.preset_today': 'اليوم',
    'filter.preset_yesterday': 'أمس',
    'filter.preset_last_week': 'آخر 7 أيام',
    'filter.preset_last_month': 'آخر 30 يوم',
    'filter.preset_last_year': 'العام الماضي',
    'filter.preset_all_time': 'كل الوقت',
    'mod.title': 'تعديل الطلب',
    'mod.alert': 'يوجد طلب تعديل!',
    'mod.accept': 'قبول التعديل',
    'mod.decline': 'رفض',
    'mod.edit_mode': 'وضع التعديل',
    'mod.save_changes': 'حفظ وإرسال للمطبخ',
    'mod.add_item': 'إضافة صنف',
    'mod.notes_label': 'ملاحظات المطبخ',
  },
  en: {
    'app.title': 'Restaurant OS',
    'app.subtitle': 'Integrated System',
    'nav.main_menu': 'Main Menu',
    'nav.testing': 'Testing',
    'nav.dashboard': 'Kitchen Display (KDS)',
    'nav.analytics': 'Analytics Dashboard',
    'nav.branches': 'Branch Management',
    'nav.orders': 'All Order History',
    'nav.history': 'Completed Orders',
    'user.manager': 'Branch Manager',
    'user.admin': 'System Admin',
    'logout': 'Logout',
    'login.title': 'System Login',
    'login.subtitle': 'Smart Restaurant Management',
    'login.username': 'Username',
    'login.button': 'Login',
    'login.loading': 'Verifying...',
    'login.error': 'Invalid username',
    'analytics.revenue': 'Total Revenue',
    'analytics.orders': 'Total Orders',
    'analytics.delivery_time': 'Avg. Delivery Time',
    'analytics.aov': 'Avg. Order Value',
    'analytics.charts.revenue_branch': 'Revenue by Branch',
    'analytics.charts.peak_hours': 'Peak Hours',
    'analytics.charts.status_dist': 'Order Status Distribution',
    'analytics.charts.top_items': 'Top Selling Items',
    'common.currency': 'EGP',
    'common.minutes': 'min',
    'common.loading': 'Loading...',
    'status.pending': 'Pending',
    'status.accepted': 'Accepted',
    'status.in_kitchen': 'In Kitchen',
    'status.out_for_delivery': 'Out for Delivery',
    'status.done': 'Completed',
    'status.cancelled': 'Cancelled',
    'action.accept': 'Accept Order',
    'action.to_kitchen': 'To Kitchen',
    'action.ready': 'Ready for Delivery',
    'action.delivered': 'Delivered (Hide)',
    'action.undo': 'Undo Complete',
    'debug.generate_data': 'Generate Test Data',
    'debug.data_added': 'Random data added!',
    'kds.search_placeholder': 'Search ID, Name, or Phone...',
    'kds.filter_all': 'Active',
    'kds.filter_done': 'Completed',
    'kds.details_title': 'Order Details',
    'kds.order_timeline': 'Status Timeline',
    'kds.close': 'Close',
    'kds.cancel_order': 'Cancel Order',
    'kds.cancel_reason_placeholder': 'Reason (e.g., Customer unreachable...)',
    'kds.confirm_cancel': 'Confirm Cancellation',
    'kds.send_alert': 'Alert Customer',
    'kds.alert_placeholder': 'Message (e.g., Order delayed due to rain...)',
    'kds.send': 'Send',
    'filter.from_date': 'From Date',
    'filter.to_date': 'To Date',
    'filter.apply': 'Apply Filter',
    'filter.reset': 'Reset',
    'filter.preset_placeholder': 'Select Period',
    'filter.preset_today': 'Today',
    'filter.preset_yesterday': 'Yesterday',
    'filter.preset_last_week': 'Last 7 Days',
    'filter.preset_last_month': 'Last 30 Days',
    'filter.preset_last_year': 'Last Year',
    'filter.preset_all_time': 'All Time',
    'mod.title': 'Modify Order',
    'mod.alert': 'Modification Request!',
    'mod.accept': 'Accept Changes',
    'mod.decline': 'Decline',
    'mod.edit_mode': 'Edit Mode',
    'mod.save_changes': 'Save & Send to Kitchen',
    'mod.add_item': 'Add Item',
    'mod.notes_label': 'Kitchen Notes',
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    // Determine direction based on language
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, toggleLanguage, t, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
