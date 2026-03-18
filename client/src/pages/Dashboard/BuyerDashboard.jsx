// ============================================================
// Buyer Dashboard — My orders, reviews, bookings
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ordersAPI, reviewsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/ui/Avatar';
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
  const [reviewModal, setReviewModal] = useState(null); // { orderId }
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', 'buyer', tab],
    queryFn: () => ordersAPI.list({ role: 'buyer', status: tab === 'All' ? undefined : tab }).then((r) => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => ordersAPI.complete(id),
    onSuccess: () => {
      toast.success(t('buyerDash.toasts.complete'));
      queryClient.invalidateQueries(['my-orders']);
    },
    onError: () => toast.error(t('buyerDash.toasts.completeFail')),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ id, reason }) => ordersAPI.dispute(id, { reason }),
    onSuccess: () => {
      toast.success(t('buyerDash.toasts.dispute'));
      queryClient.invalidateQueries(['my-orders']);
    },
    onError: () => toast.error(t('buyerDash.toasts.disputeFail')),
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => reviewsAPI.create(data),
    onSuccess: () => {
      toast.success(t('buyerDash.toasts.review'));
      setReviewModal(null);
      queryClient.invalidateQueries(['my-orders']);
    },
    onError: () => toast.error(t('buyerDash.toasts.reviewFail')),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-bold">{t('buyerDash.title')}</h1>
        </div>
        <Link to="/explore" className="btn-primary text-sm">{t('buyerDash.browse')}</Link>
      </div>

      {/* Status tabs */}
      <div className="flex overflow-x-auto gap-1 mb-5 pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s === 'All' ? t('buyerDash.all') : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="card p-4 animate-pulse h-24" />)}
        </div>
      ) : data?.orders?.length ? (
        <div className="space-y-3">
          {data.orders.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Service thumbnail */}
                <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {order.service?.images?.[0]
                    ? <img src={order.service.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🛠️</div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm">{order.service?.title}</h3>
                    <Badge label={order.status} />
                    {order.package && <span className="text-xs text-gray-400">({order.package.name})</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    <span>{t('buyerDash.seller')} {order.seller?.name}</span>
                    <span>{t('buyerDash.amount')} ${parseFloat(order.amount).toFixed(2)}</span>
                    <span>{t('buyerDash.ordered')} {format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                    {order.dueDate && <span>{t('buyerDash.due')} {format(new Date(order.dueDate), 'MMM d')}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link to="/messages" className="btn-secondary text-xs py-1">{t('buyerDash.chat')}</Link>

                  {order.status === 'DELIVERED' && (
                    <>
                      <button
                        onClick={() => completeMutation.mutate(order.id)}
                        disabled={completeMutation.isLoading}
                        className="btn-primary text-xs py-1"
                      >
                        {t('buyerDash.accept')}
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt(t('buyerDash.disputePrompt'));
                          if (reason) disputeMutation.mutate({ id: order.id, reason });
                        }}
                        className="text-xs py-1 px-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        {t('buyerDash.dispute')}
                      </button>
                    </>
                  )}

                  {order.status === 'COMPLETED' && !order.review && (
                    <button
                      onClick={() => setReviewModal(order.id)}
                      className="btn-secondary text-xs py-1"
                    >
                      {t('buyerDash.review')}
                    </button>
                  )}
                  {order.review && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      {t('buyerDash.reviewed')} ★{order.review.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-medium">{t('buyerDash.empty')}</p>
          <p className="text-sm mt-1">{t('buyerDash.emptyHint')}</p>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">{t('buyerDash.reviewModal.title')}</h2>
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">{t('buyerDash.reviewModal.rating')}</p>
              <StarRating value={reviewData.rating} onChange={(r) => setReviewData({ ...reviewData, rating: r })} size="lg" />
            </div>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              className="input h-24 resize-none mb-4"
              placeholder={t('buyerDash.reviewModal.placeholder')}
            />
            <div className="flex gap-2">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">{t('buyerDash.reviewModal.cancel')}</button>
              <button
                onClick={() => reviewMutation.mutate({ orderId: reviewModal, ...reviewData })}
                disabled={!reviewData.comment || reviewMutation.isLoading}
                className="btn-primary flex-1"
              >
                {t('buyerDash.reviewModal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
