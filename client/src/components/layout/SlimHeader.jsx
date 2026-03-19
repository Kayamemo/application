// Minimal sticky header for non-home pages — logo + nav + user menu
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { messagesAPI } from '../../services/api';
import Avatar from '../ui/Avatar';
import LangToggle from '../ui/LangToggle';

export default function SlimHeader() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';
  const isActive = (path) => path === '/' ? pathname === '/' : pathname.startsWith(path);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.conversations().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="glass border-b border-white/30 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
        <div className="md:flex-1">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xs">K</span>
          </div>
          <span className="text-lg font-black tracking-tight gradient-text">Kaya</span>
        </Link>
        </div>

        {/* Center nav — desktop only, mirrors mobile bottom nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            {
              to: '/',
              label: t('nav.home') || 'Home',
              icon: (on) => (
                <svg className="w-4 h-4" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              ),
            },
            {
              to: '/explore',
              label: t('nav.browse') || 'Explore',
              icon: () => (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
            },
            {
              to: '/messages',
              label: t('nav.messages') || 'Messages',
              badge: unreadCount,
              icon: (on) => (
                <svg className="w-4 h-4" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              ),
            },
            ...(user ? [{
              to: isSeller ? '/dashboard/seller' : '/dashboard',
              label: isSeller ? t('nav.navDashboard') || 'Dashboard' : t('nav.myOrders') || 'Orders',
              icon: (on) => isSeller ? (
                <svg className="w-4 h-4" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
            }] : []),
          ].map((item) => {
            const on = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  on ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.icon(on)}
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto md:flex-1 flex items-center justify-end gap-2" ref={ref}>
          <span className="hidden sm:block"><LangToggle variant="dark" /></span>
          {user ? (
            <>
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
              <Link to="/login"    className="text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-3">
                <span className="hidden sm:inline">{t('nav.getStarted')}</span>
                <span className="sm:hidden">Sign up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
