import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ordersAPI, reviewsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../../components/ui/BackButton';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_TABS = ['All', 'PENDING', 'ACTIVE', 'DELIVERED', 'COMPLETED', 'DISPUTED'];

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('All');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', 'buyer', tab],
    queryFn: () => ordersAPI.list({ role: 'buyer', status: tab === 'All' ? undefined : tab }).then((r) => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => ordersAPI.complete(id),
    onSuccess: () => { toast.success(t('buyerDash.toasts.complete')); queryClient.invalidateQueries(['my-orders']); },
    onError: () => toast.error(t('buyerDash.toasts.completeFail')),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ id, reason }) => ordersAPI.dispute(id, { reason }),
    onSuccess: () => { toast.success(t('buyerDash.toasts.dispute')); queryClient.invalidateQueries(['my-orders']); },
    onError: () => toast.error(t('buyerDash.toasts.disputeFail')),
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => reviewsAPI.create(data),
    onSuccess: () => { toast.success(t('buyerDash.toasts.review')); setReviewModal(null); queryClient.invalidateQueries(['my-orders']); },
    onError: () => toast.error(t('buyerDash.toasts.reviewFail')),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <BackButton />
        <h1 className="font-bold text-lg flex-1">{t('buyerDash.title')}</h1>
        <Link to="/explore" className="btn-primary text-xs py-1.5 px-3 shrink-0">{t('buyerDash.browse')}</Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }}>
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}>
            {s === 'All' ? t('buyerDash.all') : s}
          </button>
        ))}
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-20" />)}
        </div>
      ) : data?.orders?.length ? (
        <div className="card divide-y divide-gray-50">
          {data.orders.map((order) => (
            <div key={order.id} className="p-3 sm:p-4">

              {/* Top row: thumbnail + info */}
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  {order.service?.images?.[0]
                    ? <img src={order.service.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">🛠️</div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{order.service?.title}</p>
                    <Badge label={order.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-xs text-gray-400">{order.seller?.name}</span>
                    <span className="text-xs font-semibold text-gray-700">${parseFloat(order.amount).toFixed(0)}</span>
                    <span className="text-xs text-gray-400">{format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                    {order.dueDate && (
                      <span className="text-xs text-orange-500 font-medium">
                        Due {format(new Date(order.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link to="/messages"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {t('buyerDash.chat')}
                </Link>

                {order.status === 'DELIVERED' && (
                  <>
                    <button onClick={() => completeMutation.mutate(order.id)} disabled={completeMutation.isLoading}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                      {t('buyerDash.accept')}
                    </button>
                    <button onClick={() => { const r = prompt(t('buyerDash.disputePrompt')); if (r) disputeMutation.mutate({ id: order.id, reason: r }); }}
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors">
                      {t('buyerDash.dispute')}
                    </button>
                  </>
                )}

                {order.status === 'COMPLETED' && !order.review && (
                  <button onClick={() => setReviewModal(order.id)}
                    className="px-3 py-1.5 rounded-xl border border-yellow-200 text-yellow-700 bg-yellow-50 text-xs font-semibold hover:bg-yellow-100 transition-colors">
                    ⭐ {t('buyerDash.review')}
                  </button>
                )}
                {order.review && (
                  <span className="text-xs text-gray-400 flex items-center gap-1 px-2 py-1.5">
                    ★ {order.review.rating} {t('buyerDash.reviewed')}
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-medium">{t('buyerDash.empty')}</p>
          <p className="text-sm mt-1">{t('buyerDash.emptyHint')}</p>
          <Link to="/explore" className="btn-primary text-sm mt-4 inline-block">{t('buyerDash.browse')}</Link>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-bold text-base mb-4">{t('buyerDash.reviewModal.title')}</h2>
            <p className="text-sm text-gray-500 mb-2">{t('buyerDash.reviewModal.rating')}</p>
            <StarRating value={reviewData.rating} onChange={(r) => setReviewData({ ...reviewData, rating: r })} size="lg" />
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              className="input h-24 resize-none mt-4 mb-4"
              placeholder={t('buyerDash.reviewModal.placeholder')}
            />
            <div className="flex gap-2">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1 text-sm">{t('buyerDash.reviewModal.cancel')}</button>
              <button
                onClick={() => reviewMutation.mutate({ orderId: reviewModal, ...reviewData })}
                disabled={!reviewData.comment || reviewMutation.isLoading}
                className="btn-primary flex-1 text-sm">
                {t('buyerDash.reviewModal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
