import React, { ReactNode, useState } from 'react';
import { User, UserRole } from '../types';
import { useI18n } from '../i18n';
import { LayoutDashboard, LogOut, UtensilsCrossed, BarChart3, Store, History, Globe, Database, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { api } from '../services/api';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activePage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isManager = user.role === UserRole.BRANCH_MANAGER;
  const { t, toggleLanguage, language, dir } = useI18n();

  const handleGenerateData = async () => {
    await api.generateDummyData();
    window.location.reload(); // Simple reload to refresh data
  };

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`flex items-center w-full px-4 py-3 mb-2 transition-all rounded-lg group ${
        activePage === page 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      } ${!isSidebarOpen ? 'justify-center px-2' : ''}`}
      title={!isSidebarOpen ? label : ''}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isSidebarOpen ? (dir === 'rtl' ? 'ml-3' : 'mr-3') : ''}`} />
      {isSidebarOpen && <span className="font-semibold truncate">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden" dir={dir}>
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } bg-gray-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out relative`}
      >
        {/* Toggle Button */}
        <button 
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           className={`absolute top-6 ${dir === 'rtl' ? '-left-3' : '-right-3'} w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-gray-900 z-30 hover:bg-blue-500`}
        >
           {isSidebarOpen ? (
             dir === 'rtl' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />
           ) : (
             dir === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />
           )}
        </button>

        <div className={`p-6 border-b border-gray-800 flex items-center ${!isSidebarOpen ? 'justify-center p-4' : ''}`}>
          <div className={`bg-blue-600 p-2 rounded-lg ${isSidebarOpen ? (dir === 'rtl' ? 'ml-3' : 'mr-3') : ''}`}>
             <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold tracking-tight">{t('app.title')}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{t('app.subtitle')}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <div className="mb-6">
            {isSidebarOpen && (
              <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 opacity-70 whitespace-nowrap">
                {t('nav.main_menu')}
              </p>
            )}
            {isManager ? (
              <>
                <NavItem page="manager_dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} />
                <NavItem page="manager_history" icon={ClipboardList} label={t('nav.history')} />
              </>
            ) : (
              <>
                <NavItem page="admin_analytics" icon={BarChart3} label={t('nav.analytics')} />
                <NavItem page="admin_branches" icon={Store} label={t('nav.branches')} />
                <NavItem page="admin_orders" icon={History} label={t('nav.orders')} />
              </>
            )}
          </div>
          
          <div className={`mt-8 ${isSidebarOpen ? 'border-t border-gray-800 pt-4' : ''}`}>
             {isSidebarOpen && (
               <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 opacity-70 whitespace-nowrap">
                 {t('nav.testing')}
               </p>
             )}
             <button
              onClick={handleGenerateData}
              className={`flex items-center w-full px-4 py-3 mb-2 text-yellow-500 hover:bg-gray-800 hover:text-yellow-400 transition-all rounded-lg ${!isSidebarOpen ? 'justify-center px-2' : ''}`}
              title={!isSidebarOpen ? t('debug.generate_data') : ''}
            >
              <Database className={`w-5 h-5 flex-shrink-0 ${isSidebarOpen ? (dir === 'rtl' ? 'ml-3' : 'mr-3') : ''}`} />
              {isSidebarOpen && <span className="font-semibold truncate">{t('debug.generate_data')}</span>}
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
           {/* Language Toggle */}
           <button 
            onClick={toggleLanguage}
            className={`flex items-center w-full px-4 py-2 mb-4 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 ${!isSidebarOpen ? 'justify-center px-2' : 'justify-center'}`}
            title={!isSidebarOpen ? (language === 'ar' ? 'English' : 'العربية') : ''}
          >
            <Globe className={`w-4 h-4 flex-shrink-0 ${isSidebarOpen ? (dir === 'rtl' ? 'ml-2' : 'mr-2') : ''}`} />
            {isSidebarOpen && (language === 'ar' ? 'English' : 'العربية')}
          </button>

          <div className={`flex items-center mb-4 ${!isSidebarOpen ? 'justify-center' : 'px-2'}`}>
            <div className={`w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg ${isSidebarOpen ? (dir === 'rtl' ? 'ml-3' : 'mr-3') : ''}`}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{isManager ? t('user.manager') : t('user.admin')}</p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className={`flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-900/30 rounded-lg transition-colors ${!isSidebarOpen ? 'justify-center px-2' : 'justify-center'}`}
            title={!isSidebarOpen ? t('logout') : ''}
          >
            <LogOut className={`w-4 h-4 flex-shrink-0 ${isSidebarOpen ? (dir === 'rtl' ? 'ml-2' : 'mr-2') : ''}`} />
            {isSidebarOpen && t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 relative">
        <header className="bg-white shadow-sm sticky top-0 z-10 px-8 py-5 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {activePage === 'manager_dashboard' && t('nav.dashboard')}
            {activePage === 'manager_history' && t('nav.history')}
            {activePage === 'admin_analytics' && t('nav.analytics')}
            {activePage === 'admin_branches' && t('nav.branches')}
            {activePage === 'admin_orders' && t('nav.orders')}
          </h2>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;