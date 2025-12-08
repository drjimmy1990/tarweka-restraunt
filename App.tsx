import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/manager/Dashboard';
import History from './pages/manager/History';
import Analytics from './pages/admin/Analytics';
import Branches from './pages/admin/Branches';
import Orders from './pages/admin/Orders';
import Layout from './components/Layout';
import { User } from './types';
import { I18nProvider } from './i18n';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('rms_user_session');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        const lastPage = localStorage.getItem('rms_last_page');
        if (lastPage) {
          setCurrentPage(lastPage);
        } else if (parsedUser.role === 'branch_manager') {
          setCurrentPage('manager_dashboard');
        } else {
          setCurrentPage('admin_analytics');
        }
      }
    } catch (e) {
      localStorage.removeItem('rms_user_session');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('rms_user_session', JSON.stringify(loggedInUser));

    // FIX: String comparison
    const defaultPage = loggedInUser.role === 'branch_manager' ? 'manager_dashboard' : 'admin_analytics';
    setCurrentPage(defaultPage);
    localStorage.setItem('rms_last_page', defaultPage);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rms_user_session');
    localStorage.removeItem('rms_last_page');
    setCurrentPage('');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem('rms_last_page', page);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Router Logic
  // FIX: String comparison here as well
  const renderPage = () => {
    switch (currentPage) {
      case 'manager_dashboard':
        return user.role === 'branch_manager' ? <Dashboard user={user} /> : <div>Access Denied</div>;
      case 'manager_history':
        return user.role === 'branch_manager' ? <History user={user} /> : <div>Access Denied</div>;
      case 'admin_analytics':
        return user.role === 'super_admin' ? <Analytics /> : <div>Access Denied</div>;
      case 'admin_branches':
        return user.role === 'super_admin' ? <Branches /> : <div>Access Denied</div>;
      case 'admin_orders':
        return user.role === 'super_admin' ? <Orders /> : <div>Access Denied</div>;
      default:
        return user.role === 'branch_manager' ? <Dashboard user={user} /> : <Analytics />;
    }
  };

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      activePage={currentPage}
      onNavigate={handleNavigate}
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