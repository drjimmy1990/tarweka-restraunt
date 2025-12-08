import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { UtensilsCrossed, Globe, Lock, Mail, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, dir, toggleLanguage, language } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await api.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError(language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password');
      }
    } catch (err) {
      setError('System Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative" dir={dir}>
      {/* Language Toggle */}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className={`absolute top-3.5 text-gray-400 w-5 h-5 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className={`absolute top-3.5 text-gray-400 w-5 h-5 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? t('login.loading') : t('login.button')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Manager Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;