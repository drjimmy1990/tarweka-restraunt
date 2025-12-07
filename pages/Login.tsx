import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { UtensilsCrossed, Globe } from 'lucide-react';
import { useI18n } from '../i18n';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, dir, toggleLanguage, language } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await api.login(username);
      if (user) {
        onLogin(user);
      } else {
        setError(t('login.error'));
      }
    } catch (err) {
      setError('Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative" dir={dir}>
      {/* Language Toggle - Absolute Position */}
      <button 
        onClick={toggleLanguage}
        className={`absolute top-6 ${dir === 'rtl' ? 'left-6' : 'right-6'} flex items-center px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md text-gray-700 text-sm font-medium transition-all`}
      >
        <Globe className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('login.title')}</h1>
          <p className="text-gray-500 mt-2">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('login.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder=""
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform transition-all hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? t('login.loading') : t('login.button')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Demo users: 
            <span className="font-mono bg-gray-100 px-1 py-0.5 rounded mx-1">admin</span> 
            or 
            <span className="font-mono bg-gray-100 px-1 py-0.5 rounded mx-1">manager1</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;