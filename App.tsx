import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/manager/Dashboard';
import History from './pages/manager/History';
import Analytics from './pages/admin/Analytics';
import Branches from './pages/admin/Branches';
import Orders from './pages/admin/Orders';
import Layout from './components/Layout';
import { User, UserRole } from './types';
import { I18nProvider } from './i18n';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('');

  // Persist login state check
  useEffect(() => {
    const savedUser = localStorage.getItem('rms_user_session');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Set initial page based on role
      if (parsedUser.role === UserRole.BRANCH_MANAGER) {
        setCurrentPage('manager_dashboard');
      } else {
        setCurrentPage('admin_analytics');
      }
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('rms_user_session', JSON.stringify(loggedInUser));
    if (loggedInUser.role === UserRole.BRANCH_MANAGER) {
      setCurrentPage('manager_dashboard');
    } else {
      setCurrentPage('admin_analytics');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rms_user_session');
    setCurrentPage('');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Router Logic (Simple State-based Router)
  const renderPage = () => {
    switch (currentPage) {
      case 'manager_dashboard':
        return user.role === UserRole.BRANCH_MANAGER ? <Dashboard user={user} /> : <div>Access Denied</div>;
      case 'manager_history':
        return user.role === UserRole.BRANCH_MANAGER ? <History user={user} /> : <div>Access Denied</div>;
      case 'admin_analytics':
        return user.role === UserRole.SUPER_ADMIN ? <Analytics /> : <div>Access Denied</div>;
      case 'admin_branches':
        return user.role === UserRole.SUPER_ADMIN ? <Branches /> : <div>Access Denied</div>;
      case 'admin_orders':
        return user.role === UserRole.SUPER_ADMIN ? <Orders /> : <div>Access Denied</div>;
      default:
        return <div className="p-10 text-center">Page not found</div>;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activePage={currentPage}
      onNavigate={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;