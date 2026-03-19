// Mobile bottom navigation bar — visible only on small screens
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { messagesAPI } from '../../services/api';

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.conversations().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  if (!user) return null;

  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const items = [
    {
      to: '/',
      label: t('nav.home') || 'Home',
      isActive: pathname === '/',
      icon: (on) => (
        <svg className="w-5 h-5" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/explore',
      label: t('nav.browse') || 'Explore',
      isActive: pathname.startsWith('/explore'),
      icon: (on) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      to: '/messages',
      label: t('nav.messages') || 'Messages',
      isActive: pathname.startsWith('/messages'),
      badge: unreadCount,
      icon: (on) => (
        <svg className="w-5 h-5" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      to: isSeller ? '/dashboard/seller' : '/dashboard',
      label: isSeller ? t('nav.navDashboard') || 'Dashboard' : t('nav.myOrders') || 'Orders',
      isActive: pathname.startsWith('/dashboard'),
      icon: (on) => isSeller ? (
        <svg className="w-5 h-5" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill={on ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={on ? 0 : 2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-2xl md:hidden">
      <div className="flex items-stretch h-16 px-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
          >
            {/* Icon with active pill background */}
            <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
              item.isActive ? 'bg-primary-50' : ''
            }`}>
              <span className={item.isActive ? 'text-primary-600' : 'text-gray-400'}>
                {item.icon(item.isActive)}
              </span>
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold leading-none ${item.isActive ? 'text-primary-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
      {/* Safe area for phones with home indicator */}
      <div className="h-safe-bottom bg-white" />
    </nav>
  );
}
