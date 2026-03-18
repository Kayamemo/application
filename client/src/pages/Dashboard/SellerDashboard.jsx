// ============================================================
// Seller Dashboard — Gig management, earnings, subscription
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('orders'); // orders | services | earnings | subscription

  const { data: orders } = useQuery({
    queryKey: ['seller-orders', activeTab],
    queryFn: () => ordersAPI.list({ role: 'seller' }).then((r) => r.data),
    enabled: activeTab === 'orders',
  });

  const { data: services } = useQuery({
    queryKey: ['my-services'],
    queryFn: () => servicesAPI.myServices().then((r) => r.data),
    enabled: activeTab === 'services',
  });

  const { data: earnings } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => paymentsAPI.getEarnings().then((r) => r.data),
    enabled: activeTab === 'earnings',
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => paymentsAPI.getSubscription().then((r) => r.data),
    enabled: activeTab === 'subscription',
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

  const billingPortalMutation = useMutation({
    mutationFn: () => paymentsAPI.getBillingPortal(),
    onSuccess: ({ data }) => { window.location.href = data.url; },
  });

  const TABS = [
    { id: 'orders',       label: t('sellerDash.tabs.orders') },
    { id: 'services',     label: t('sellerDash.tabs.services') },
    { id: 'earnings',     label: t('sellerDash.tabs.earnings') },
    { id: 'subscription', label: t('sellerDash.tabs.subscription') },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-bold">{t('sellerDash.title')}</h1>
        </div>
        <Link to="/services/new" className="btn-primary text-sm">{t('sellerDash.newService')}</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {!orders?.orders?.length && <div className="text-center py-12 text-gray-400">{t('sellerDash.orders.empty')}</div>}
          {orders?.orders?.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm">{order.service?.title}</h3>
                    <Badge label={order.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    <span>{t('sellerDash.orders.buyer')} {order.buyer?.name}</span>
                    <span>{t('sellerDash.orders.earnings')} ${parseFloat(order.sellerEarnings).toFixed(2)}</span>
                    <span>{t('sellerDash.orders.due')} {order.dueDate ? format(new Date(order.dueDate), 'MMM d') : t('sellerDash.orders.na')}</span>
                  </div>
                  {order.requirements && (
                    <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">📝 {order.requirements}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link to="/messages" className="btn-secondary text-xs py-1">{t('sellerDash.orders.chat')}</Link>
                  {order.status === 'ACTIVE' && (
                    <button
                      onClick={() => deliverMutation.mutate(order.id)}
                      disabled={deliverMutation.isLoading}
                      className="btn-primary text-xs py-1"
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
        <div className="space-y-3">
          {!services?.length && (
            <div className="text-center py-12 text-gray-400">
              <p>{t('sellerDash.services.empty')}</p>
              <Link to="/services/new" className="btn-primary text-sm mt-3 inline-block">{t('sellerDash.services.createFirst')}</Link>
            </div>
          )}
          {services?.map((svc) => (
            <div key={svc.id} className="card p-4 flex items-center gap-4">
              <div className="w-14 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {svc.images?.[0]
                  ? <img src={svc.images[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">{svc.niche?.icon || '🛠️'}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{svc.title}</h3>
                  <Badge
                    label={svc.isActive ? t('sellerDash.services.active') : t('sellerDash.services.paused')}
                    variant={svc.isActive ? 'green' : 'gray'}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {svc._count?.orders || 0} {t('sellerDash.services.orders')} · {t('sellerDash.services.from')} ${parseFloat(svc.basePrice).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link to={`/services/${svc.id}`} className="btn-secondary text-xs py-1">{t('sellerDash.services.view')}</Link>
                <button
                  onClick={() => toggleServiceMutation.mutate({ id: svc.id, isActive: !svc.isActive })}
                  className="btn-secondary text-xs py-1"
                >
                  {svc.isActive ? t('sellerDash.services.pause') : t('sellerDash.services.activate')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Earnings Tab ── */}
      {activeTab === 'earnings' && earnings && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('sellerDash.earnings.total'),    value: earnings.totalEarnings,    color: 'text-green-600' },
            { label: t('sellerDash.earnings.escrow'),   value: earnings.pendingEarnings,  color: 'text-yellow-600' },
            { label: t('sellerDash.earnings.released'), value: earnings.releasedEarnings, color: 'text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>${parseFloat(stat.value || 0).toFixed(2)}</p>
            </div>
          ))}
          <div className="sm:col-span-3 text-sm text-gray-500 text-center">
            {t('sellerDash.earnings.note')}
          </div>
        </div>
      )}

      {/* ── Subscription Tab ── */}
      {activeTab === 'subscription' && subscription && (
        <div className="card p-6 max-w-sm">
          <h2 className="font-bold text-lg mb-3">{t('sellerDash.subscription.title')}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('sellerDash.subscription.status')}</span>
              <Badge label={subscription.profile?.subscriptionStatus} />
            </div>
            {subscription.profile?.subscriptionEndsAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('sellerDash.subscription.renewsEnds')}</span>
                <span>{format(new Date(subscription.profile.subscriptionEndsAt), 'MMM d, yyyy')}</span>
              </div>
            )}
            {subscription.profile?.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('sellerDash.subscription.trialEnds')}</span>
                <span>{format(new Date(subscription.profile.trialEndsAt), 'MMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>{t('sellerDash.subscription.plan')}</span>
              <span>{t('sellerDash.subscription.planValue')}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
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
      )}
    </div>
  );
}
