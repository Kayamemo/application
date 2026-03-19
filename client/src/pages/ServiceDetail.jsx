import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { servicesAPI, messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/ui/Avatar';
import BackButton from '../components/ui/BackButton';
import StarRating from '../components/ui/StarRating';
import toast from 'react-hot-toast';

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesAPI.get(id).then((r) => r.data),
  });

  const handleContact = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await messagesAPI.startConversation({ sellerId: service.sellerId, serviceId: id });
      navigate(`/messages/${data.id}`);
    } catch {
      toast.error(t('detail.noConversation'));
    }
  };

  const handleOrder = () => {
    if (!user) return navigate('/login');
    const pkg = service.packages[selectedPackage];
    navigate(`/checkout/${id}?packageId=${pkg?.id || ''}`);
  };

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="aspect-[4/3] sm:aspect-video bg-gray-200 rounded-2xl" />
      <div className="h-6 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );

  if (!service) return (
    <div className="text-center py-20 text-gray-400">{t('detail.notFound')}</div>
  );

  const pkg = service.packages?.[selectedPackage];
  const price = parseFloat(pkg?.price || service.basePrice);
  const reviews = service.orders?.map((o) => o.review).filter(Boolean) || [];
  const avgRating = service.seller?.sellerProfile?.avgRating || 0;
  const totalReviews = service.seller?.sellerProfile?.totalReviews || 0;
  const isOwner = service.sellerId === user?.id;

  return (
    <div className="flex flex-col flex-1">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-3">
          <BackButton />
          <span className="text-sm text-gray-500 truncate flex-1">{service.title}</span>
          {service.niche && (
            <span className="shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {service.niche.icon} {service.niche.name}
            </span>
          )}
        </div>
      </div>

      <div className={`bg-gray-50 flex-1 ${!isOwner ? 'pb-24 lg:pb-0' : ''}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">

          {/* ── MAIN CONTENT ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Image */}
            <div className="rounded-2xl overflow-hidden bg-gray-100">
              {service.images?.length > 0 ? (
                <>
                  <img
                    src={service.images[activeImage]}
                    alt={service.title}
                    className="w-full aspect-[4/3] sm:aspect-video object-cover"
                  />
                  {service.images.length > 1 && (
                    <div className="flex gap-2 p-2.5 bg-white">
                      {service.images.map((img, i) => (
                        <button key={i} onClick={() => setActiveImage(i)}
                          className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-indigo-500' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] sm:aspect-video flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                  <span className="text-6xl">{service.niche?.icon || '🛠️'}</span>
                </div>
              )}
            </div>

            {/* Title + seller */}
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
                {service.title}
              </h1>
              <Link to={`/sellers/${service.sellerId}`} className="flex items-center gap-3 group">
                <Avatar src={service.seller?.avatar} name={service.seller?.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {service.seller?.name}
                  </p>
                  {service.seller?.sellerProfile?.tagline && (
                    <p className="text-xs text-gray-400 truncate">{service.seller.sellerProfile.tagline}</p>
                  )}
                </div>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <StarRating value={avgRating} size="sm" />
                    <span className="text-sm font-bold text-gray-800">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({totalReviews})</span>
                  </div>
                )}
              </Link>
            </div>

            {/* ── Mobile order card (hidden on desktop, desktop uses right column) ── */}
            {!isOwner && (
              <div className="lg:hidden bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {service.packages?.length > 0 && (
                  <div className="flex border-b border-gray-100">
                    {service.packages.map((p, i) => (
                      <button key={p.id} onClick={() => setSelectedPackage(i)}
                        className={`flex-1 py-3 text-sm font-semibold transition-all relative ${selectedPackage === i ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {p.name}
                        {p.isPopular && <span className="ml-1 text-yellow-400">★</span>}
                        {selectedPackage === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-gray-900">${price.toFixed(0)}</span>
                    {pkg ? (
                      <div className="text-xs text-gray-400 text-right">
                        <p>🕐 {pkg.deliveryDays} {t('detail.daysPlural')}</p>
                        <p>🔄 {pkg.revisions} {t('detail.revisionsPlural')}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">🕐 {service.deliveryDays} {t('detail.daysPlural')}</p>
                    )}
                  </div>
                  {pkg?.description && <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>}
                  {pkg?.features?.length > 0 && (
                    <ul className="space-y-1.5 mb-4">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button onClick={handleOrder} className="btn-primary w-full py-3 font-bold mb-2">
                    {t('detail.continue')} — ${price.toFixed(0)}
                  </button>
                  <button onClick={handleContact}
                    className="w-full border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm">
                    {t('detail.contactSeller')}
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-3">{t('detail.aboutService')}</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{service.description}</p>
              {service.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-gray-50">
                  {service.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* About Seller — compact */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-3">{t('detail.aboutSeller')}</h2>
              <div className="flex items-center gap-3 mb-3">
                <Link to={`/sellers/${service.sellerId}`}>
                  <Avatar src={service.seller?.avatar} name={service.seller?.name} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/sellers/${service.sellerId}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                    {service.seller?.name}
                  </Link>
                  {service.seller?.bio && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.seller.bio}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { icon: '📍', label: t('detail.location'), value: service.seller?.location || service.location || '—' },
                  { icon: '⚡', label: t('detail.responseTime'), value: service.seller?.sellerProfile?.responseTime || t('detail.na') },
                  { icon: '✅', label: t('detail.ordersCompleted'), value: service.seller?.sellerProfile?.totalOrders || 0 },
                  { icon: '📅', label: t('detail.memberSince'), value: new Date(service.seller?.sellerProfile?.memberSince).toLocaleDateString('en', { month: 'short', year: 'numeric' }) },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-base">{s.icon}</p>
                    <p className="font-semibold text-gray-900 text-xs mt-0.5">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">{t('detail.reviews')}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
                    <StarRating value={avgRating} size="sm" />
                    <span className="text-xs text-gray-400">({totalReviews})</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Avatar src={review.buyer?.avatar} name={review.buyer?.name} size="xs" />
                        <span className="font-semibold text-sm text-gray-900">{review.buyer?.name}</span>
                        <StarRating value={review.rating} size="sm" />
                        <span className="text-xs text-gray-400 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                      {review.sellerReply && (
                        <div className="mt-2 pl-3 border-l-2 border-indigo-200 bg-indigo-50 rounded-r-xl py-1.5 pr-3">
                          <p className="text-xs text-indigo-600 font-semibold mb-0.5">💬 {t('detail.sellerReply')}</p>
                          <p className="text-xs text-gray-600">{review.sellerReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: desktop order panel ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-20 overflow-hidden">

              {service.packages?.length > 0 && (
                <div className="flex border-b border-gray-100">
                  {service.packages.map((p, i) => (
                    <button key={p.id} onClick={() => setSelectedPackage(i)}
                      className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
                        selectedPackage === i ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                      }`}>
                      {p.name}
                      {p.isPopular && <span className="ml-1 text-yellow-400">★</span>}
                      {selectedPackage === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-3xl font-black text-gray-900">${price.toFixed(0)}</span>
                  {pkg && (
                    <div className="text-xs text-gray-400 text-right">
                      <p>🕐 {pkg.deliveryDays} {t('detail.daysPlural')}</p>
                      <p>🔄 {pkg.revisions} {t('detail.revisionsPlural')}</p>
                    </div>
                  )}
                </div>
                {pkg?.description && <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>}

                {pkg?.features?.length > 0 && (
                  <ul className="space-y-1.5 mb-5">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {!isOwner ? (
                  <>
                    <button onClick={handleOrder} className="btn-primary w-full py-3 text-base font-bold mb-2">
                      {t('detail.continue')} — ${price.toFixed(0)}
                    </button>
                    <button onClick={handleContact}
                      className="w-full border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm">
                      {t('detail.contactSeller')}
                    </button>
                  </>
                ) : (
                  <div className="text-center text-sm text-gray-400 py-3 bg-gray-50 rounded-xl">
                    {t('detail.ownService')}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">📍 {t('detail.location')}</span>
                    <span className="font-medium text-gray-700 text-right">
                      {service.isRemote ? t('detail.remote') : service.location || t('detail.inPerson')}
                    </span>
                  </div>
                  {service.availability?.hours && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">🕐 {t('detail.availability')}</span>
                      <span className="font-medium text-gray-700">{service.availability.hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {!isOwner && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg px-4 py-3">
          <div className="flex gap-2 items-center">
            <div className="shrink-0 mr-1">
              <p className="text-lg font-black text-gray-900">${price.toFixed(0)}</p>
              {pkg && <p className="text-[10px] text-gray-400 leading-none">{pkg.deliveryDays}d delivery</p>}
            </div>
            <button onClick={handleOrder} className="btn-primary flex-1 py-2.5 font-bold text-sm">
              {t('detail.continue')}
            </button>
            <button onClick={handleContact}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {t('detail.contactSeller')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
