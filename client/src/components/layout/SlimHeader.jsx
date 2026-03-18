// Minimal sticky header for non-home pages — logo + user menu only
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';
import LangToggle from '../ui/LangToggle';

export default function SlimHeader() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="glass border-b border-white/30 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xs">K</span>
          </div>
          <span className="text-lg font-black tracking-tight gradient-text">Kaya</span>
        </Link>

        <div className="flex items-center gap-2" ref={ref}>
          <LangToggle variant="dark" />
          {user ? (
            <>
              <Link to="/messages" className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
                {t('nav.messages')}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-48 card shadow-xl z-50 py-1 overflow-hidden animate-fade-up">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-indigo-500 font-medium capitalize">{user.role.toLowerCase()}</p>
                    </div>
                    {[
                      { to: '/dashboard', label: `📦 ${t('nav.myOrders')}` },
                      ...(user.role === 'SELLER' || user.role === 'ADMIN' ? [{ to: '/dashboard/seller', label: `🛠️ ${t('nav.sellerDash')}` }] : []),
                      ...(user.role === 'ADMIN' ? [{ to: '/admin', label: `⚙️ ${t('nav.adminPanel')}` }] : []),
                    ].map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={async () => { await logout(); navigate('/'); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-4">{t('nav.getStarted')}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
