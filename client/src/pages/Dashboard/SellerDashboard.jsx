// ============================================================
// Seller Dashboard — clean redesign, desktop + mobile
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { servicesAPI, ordersAPI, paymentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import BackButton from '../../components/ui/BackButton';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SellerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('orders');

  // All fetched eagerly so stats bar always has data
  const { data: ordersData } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => ordersAPI.list({ role: 'seller' }).then((r) => r.data),
  });

  const { data: services } = useQuery({
    queryKey: ['my-services'],
    queryFn: () => servicesAPI.myServices().then((r) => r.data),
  });

  const { data: earnings } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => paymentsAPI.getEarnings().then((r) => r.data),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => paymentsAPI.getSubscription().then((r) => r.data),
  });

  const deliverMutation = useMutation({
    mutationFn: (id) => ordersAPI.deliver(id),
    onSuccess: () => {
      toast.success(t('sellerDash.orders.delivered'));
      queryClient.invalidateQueries(['seller-orders']);
    },
  });

  const toggleServiceMutation = useMutation({
    mutationFn: ({ id, isActive }) => servicesAPI.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-services']);
      toast.success(t('sellerDash.services.active'));
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => servicesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-services']);
      toast.success(t('sellerDash.services.deleted'));
    },
    onError: () => toast.error(t('sellerDash.services.deleteFail')),
  });

  const billingPortalMutation = useMutation({
    mutationFn: () => paymentsAPI.getBillingPortal(),
    onSuccess: ({ data }) => { window.location.href = data.url; },
  });

  const orders = ordersData?.orders || [];
  const activeOrdersCount = orders.filter((o) => o.status === 'ACTIVE').length;

  const TABS = [
    { id: 'orders',       label: t('sellerDash.tabs.orders') },
    { id: 'services',     label: t('sellerDash.tabs.services') },
    { id: 'earnings',     label: t('sellerDash.tabs.earnings') },
    { id: 'subscription', label: t('sellerDash.tabs.subscription') },
  ];

  return (
    <div className="w-full overflow-x-hidden">
    <div className="max-w-3xl mx-auto px-4 py-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('sellerDash.title')}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.name}</p>
          </div>
        </div>
        <Link to="/services/new" className="btn-primary text-sm w-full sm:w-auto text-center">
          + {t('sellerDash.newService')}
        </Link>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t('sellerDash.stats.activeOrders'), value: activeOrdersCount, icon: '📦', color: 'text-blue-600' },
          { label: t('sellerDash.stats.totalEarnings'), value: `$${parseFloat(earnings?.totalEarnings || 0).toFixed(0)}`, icon: '💰', color: 'text-green-600' },
          { label: t('sellerDash.stats.services'), value: services?.length || 0, icon: '🛠️', color: 'text-violet-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl">{stat.icon}</p>
            <p className={`text-lg sm:text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Pill tabs ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {!orders.length && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📦</div>
              <p className="font-medium">{t('sellerDash.orders.empty')}</p>
            </div>
          )}
          {orders.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-base text-gray-900 truncate">{order.service?.title}</h3>
                    <Badge label={order.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>👤 {order.buyer?.name}</span>
                    <span>💰 ${parseFloat(order.sellerEarnings).toFixed(2)}</span>
                    <span>📅 {order.dueDate ? format(new Date(order.dueDate), 'MMM d') : t('sellerDash.orders.na')}</span>
                  </div>
                  {order.requirements && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      📝 {order.requirements}
                    </p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-2 sm:flex-col sm:items-end shrink-0">
                  <Link to="/messages" className="btn-secondary text-xs py-1.5 flex-1 sm:flex-none text-center">
                    {t('sellerDash.orders.chat')}
                  </Link>
                  {order.status === 'ACTIVE' && (
                    <button
                      onClick={() => deliverMutation.mutate(order.id)}
                      disabled={deliverMutation.isLoading}
                      className="btn-primary text-xs py-1.5 flex-1 sm:flex-none"
                    >
                      {t('sellerDash.orders.markDelivered')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Services Tab ── */}
      {activeTab === 'services' && (
        <div>
          {!services?.length ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🛠️</div>
              <p className="font-medium">{t('sellerDash.services.empty')}</p>
              <Link to="/services/new" className="btn-primary text-sm mt-4 inline-block">
                {t('sellerDash.services.createFirst')}
              </Link>
            </div>
          ) : (
            <div className="card divide-y divide-gray-50">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {svc.images?.[0]
                      ? <img src={svc.images[0]} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xl">{svc.niche?.icon || '🛠️'}</span>
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{svc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {svc.isActive ? t('sellerDash.services.active') : t('sellerDash.services.paused')}
                      </span>
                      <span className="text-xs text-gray-400">{svc._count?.orders || 0} orders</span>
                      <span className="text-xs font-bold text-gray-700">${parseFloat(svc.basePrice).toFixed(0)}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to={`/services/${svc.id}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title={t('sellerDash.services.view')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link to={`/services/${svc.id}/edit`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => toggleServiceMutation.mutate({ id: svc.id, isActive: !svc.isActive })}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${svc.isActive ? 'hover:bg-orange-50 text-orange-400' : 'hover:bg-green-50 text-green-500'}`}
                      title={svc.isActive ? t('sellerDash.services.pause') : t('sellerDash.services.activate')}>
                      {svc.isActive ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t('sellerDash.services.deleteConfirm'))) {
                          deleteServiceMutation.mutate(svc.id);
                        }
                      }}
                      disabled={deleteServiceMutation.isLoading}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-40"
                      title={t('sellerDash.services.delete')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Earnings Tab ── */}
      {activeTab === 'earnings' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: t('sellerDash.earnings.total'),    value: earnings?.totalEarnings,    color: 'text-green-600',  bg: 'bg-green-50',  icon: '💰' },
              { label: t('sellerDash.earnings.escrow'),   value: earnings?.pendingEarnings,  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '🔒' },
              { label: t('sellerDash.earnings.released'), value: earnings?.releasedEarnings, color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '✅' },
            ].map((stat) => (
              <div key={stat.label} className={`card p-5 text-center ${stat.bg}`}>
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className={`text-3xl font-black ${stat.color}`}>${parseFloat(stat.value || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="card p-4 text-sm text-gray-500 flex items-start gap-2">
            <span className="text-base shrink-0">ℹ️</span>
            <span>{t('sellerDash.earnings.note')}</span>
          </div>
        </div>
      )}

      {/* ── Subscription Tab ── */}
      {activeTab === 'subscription' && subscription && (
        <div className="max-w-sm">
          <div className="card overflow-hidden">
            {/* Gradient banner */}
            <div className="h-20 bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center px-5">
              <div>
                <p className="text-white font-black text-lg">{t('sellerDash.subscription.title')}</p>
                <p className="text-white/70 text-xs">{t('sellerDash.subscription.planValue')}</p>
              </div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('sellerDash.subscription.status')}</span>
                <Badge label={subscription.profile?.subscriptionStatus} />
              </div>
              {subscription.profile?.subscriptionEndsAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('sellerDash.subscription.renewsEnds')}</span>
                  <span className="font-medium">{format(new Date(subscription.profile.subscriptionEndsAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {subscription.profile?.trialEndsAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('sellerDash.subscription.trialEnds')}</span>
                  <span className="font-medium">{format(new Date(subscription.profile.trialEndsAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>{t('sellerDash.subscription.plan')}</span>
                <span>{t('sellerDash.subscription.planValue')}</span>
              </div>
              <div className="pt-2">
                {subscription.profile?.stripeSubscriptionId ? (
                  <button
                    onClick={() => billingPortalMutation.mutate()}
                    className="btn-secondary w-full"
                  >
                    {t('sellerDash.subscription.manage')}
                  </button>
                ) : (
                  <Link to="/subscribe" className="btn-primary w-full block text-center">
                    {t('sellerDash.subscription.subscribe')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
