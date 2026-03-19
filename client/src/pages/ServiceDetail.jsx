// ============================================================
// Service Detail Page — Clean structured layout
// ============================================================
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
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="aspect-video bg-gray-200 rounded-2xl" />
      <div className="h-8 bg-gray-200 rounded w-2/3" />
    </div>
  );

  if (!service) return (
    <div className="text-center py-20 text-gray-400">{t('detail.notFound')}</div>
  );

  const pkg = service.packages?.[selectedPackage];
  const reviews = service.orders?.map((o) => o.review).filter(Boolean) || [];
  const avgRating = service.seller?.sellerProfile?.avgRating || 0;
  const totalReviews = service.seller?.sellerProfile?.totalReviews || 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Breadcrumb bar ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <BackButton />
          <nav className="hidden sm:flex text-sm text-gray-400 items-center gap-1 min-w-0">
            <Link to="/" className="hover:text-primary-600 transition-colors shrink-0">{t('detail.home')}</Link>
            <span className="shrink-0">/</span>
            <Link to={`/explore?niche=${service.niche?.slug}`} className="hover:text-primary-600 transition-colors shrink-0">
              {service.niche?.icon} {service.niche?.name}
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-gray-600 truncate">{service.title}</span>
          </nav>
          {/* Mobile: show category link instead of full breadcrumb */}
          <Link to={`/explore?niche=${service.niche?.slug}`} className="sm:hidden text-sm text-gray-500 flex items-center gap-1">
            {service.niche?.icon} {service.niche?.name}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {service.niche?.icon} {service.niche?.name}
                </span>
                {service.isRemote && (
                  <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    🌐 {t('detail.remote')}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {service.title}
              </h1>
            </div>

            {/* Seller row */}
            <Link to={`/sellers/${service.sellerId}`} className="flex items-center gap-3 group">
              <Avatar src={service.seller?.avatar} name={service.seller?.name} size="md" />
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {service.seller?.name}
                </p>
                <p className="text-sm text-gray-500">{service.seller?.sellerProfile?.tagline}</p>
              </div>
              {totalReviews > 0 && (
                <div className="ml-auto flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl">
                  <StarRating value={avgRating} size="sm" />
                  <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({totalReviews})</span>
                </div>
              )}
            </Link>

            {/* Images */}
            {service.images?.length > 0 ? (
              <div className="rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={service.images[activeImage]}
                  alt={service.title}
                  className="w-full aspect-video object-cover"
                />
                {service.images.length > 1 && (
                  <div className="flex gap-2 p-3 bg-white">
                    {service.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-primary-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <span className="text-6xl">{service.niche?.icon}</span>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary-500 rounded-full inline-block" />
                {t('detail.aboutService')}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{service.description}</p>
              {service.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  {service.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* About Seller */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary-500 rounded-full inline-block" />
                {t('detail.aboutSeller')}
              </h2>
              <div className="flex items-start gap-4">
                <Link to={`/sellers/${service.sellerId}`}>
                  <Avatar src={service.seller?.avatar} name={service.seller?.name} size="lg" />
                </Link>
                <div className="flex-1">
                  <Link to={`/sellers/${service.sellerId}`} className="font-bold text-gray-900 hover:text-primary-600 transition-colors text-lg">
                    {service.seller?.name}
                  </Link>
                  {service.seller?.bio && (
                    <p className="text-sm text-gray-500 mt-1">{service.seller.bio}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: t('detail.location'), value: service.seller?.location || service.location || t('detail.notSpecified'), icon: '📍' },
                      { label: t('detail.responseTime'), value: service.seller?.sellerProfile?.responseTime || t('detail.na'), icon: '⚡' },
                      { label: t('detail.ordersCompleted'), value: service.seller?.sellerProfile?.totalOrders || 0, icon: '✅' },
                      { label: t('detail.memberSince'), value: new Date(service.seller?.sellerProfile?.memberSince).toLocaleDateString('en', { month: 'short', year: 'numeric' }), icon: '📅' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-lg">{stat.icon}</p>
                        <p className="font-semibold text-gray-900 text-sm mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary-500 rounded-full inline-block" />
                  {t('detail.reviews')}
                </h2>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
                  <div>
                    <StarRating value={avgRating} size="md" />
                    <p className="text-sm text-gray-400 mt-0.5">{totalReviews} {t('detail.reviews')}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar src={review.buyer?.avatar} name={review.buyer?.name} size="sm" />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{review.buyer?.name}</p>
                          <div className="flex items-center gap-2">
                            <StarRating value={review.rating} size="sm" />
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                      {review.sellerReply && (
                        <div className="mt-3 pl-4 border-l-2 border-primary-200 bg-primary-50 rounded-r-xl py-2 pr-3">
                          <p className="text-xs text-primary-600 font-semibold mb-1">💬 {t('detail.sellerReply')}</p>
                          <p className="text-sm text-gray-600">{review.sellerReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Order panel ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md sticky top-20 overflow-hidden">

              {/* Package tabs */}
              {service.packages?.length > 0 && (
                <div className="flex border-b border-gray-100">
                  {service.packages.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPackage(i)}
                      className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${
                        selectedPackage === i
                          ? 'text-primary-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {p.name}
                      {p.isPopular && <span className="ml-1 text-yellow-400">★</span>}
                      {selectedPackage === i && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-5">
                {pkg ? (
                  <>
                    {/* Price */}
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">{pkg.name}</h3>
                      <span className="text-3xl font-black text-gray-900">
                        ${parseFloat(pkg.price).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>

                    {/* Meta */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 flex-1 justify-center">
                        <span className="text-base">🕐</span>
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-900">{pkg.deliveryDays}</p>
                          <p className="text-[10px] text-gray-400">{t('detail.daysPlural')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 flex-1 justify-center">
                        <span className="text-base">🔄</span>
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-900">{pkg.revisions}</p>
                          <p className="text-[10px] text-gray-400">{t('detail.revisionsPlural')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    {pkg.features?.length > 0 && (
                      <ul className="space-y-2 mb-5">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <div className="mb-5">
                    <p className="text-3xl font-black text-gray-900">${parseFloat(service.basePrice).toFixed(2)}</p>
                    <p className="text-sm text-gray-400 mt-1">🕐 {service.deliveryDays} {t('detail.daysPlural')} delivery</p>
                  </div>
                )}

                {/* CTAs */}
                {service.sellerId !== user?.id ? (
                  <button onClick={handleOrder} className="btn-primary w-full mb-3 py-3 text-base font-bold">
                    {t('detail.continue')} — ${parseFloat(pkg?.price || service.basePrice).toFixed(2)}
                  </button>
                ) : (
                  <div className="text-center text-sm text-gray-400 mb-3 py-2 bg-gray-50 rounded-xl">
                    {t('detail.ownService')}
                  </div>
                )}
                <button onClick={handleContact} className="w-full border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-primary-300 hover:text-primary-600 transition-all text-sm">
                  {t('detail.contactSeller')}
                </button>

                {/* Service meta */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">📍 {t('detail.location')}</span>
                    <span className="font-medium text-gray-700">
                      {service.isRemote ? t('detail.remote') : service.location || t('detail.inPerson')}
                    </span>
                  </div>
                  {service.availability?.hours && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1">🕐 {t('detail.availability')}</span>
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
  );
}
