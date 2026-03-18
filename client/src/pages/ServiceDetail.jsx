// ============================================================
// Service Detail Page — Gig page with packages, reviews, order CTA
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
import Badge from '../components/ui/Badge';
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
      const { data } = await messagesAPI.startConversation({
        sellerId: service.sellerId,
        serviceId: id,
      });
      navigate(`/messages/${data.id}`);
    } catch (err) {
      toast.error(t('detail.noConversation'));
    }
  };

  const handleOrder = () => {
    if (!user) return navigate('/login');
    const pkg = service.packages[selectedPackage];
    navigate(`/checkout/${id}?packageId=${pkg?.id || ''}`);
  };

  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="aspect-video bg-gray-200 rounded-xl mb-6" />
    </div>
  );

  if (!service) return <div className="text-center py-20 text-gray-400">{t('detail.notFound')}</div>;

  const pkg = service.packages[selectedPackage];
  const reviews = service.orders?.map((o) => o.review).filter(Boolean) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: Service details ─────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Back + Breadcrumb */}
          <div className="flex items-center gap-3">
            <BackButton />
            <nav className="text-sm text-gray-400">
              <Link to="/" className="hover:text-primary-600">{t('detail.home')}</Link> /
              <Link to={`/explore?niche=${service.niche?.slug}`} className="hover:text-primary-600 mx-1">{service.niche?.name}</Link> /
              <span className="text-gray-600">{service.title}</span>
            </nav>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{service.title}</h1>

          {/* Seller */}
          <Link to={`/sellers/${service.sellerId}`} className="flex items-center gap-3 group">
            <Avatar src={service.seller?.avatar} name={service.seller?.name} size="md" />
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {service.seller?.name}
              </p>
              <p className="text-sm text-gray-500">{service.seller?.sellerProfile?.tagline}</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <StarRating value={service.seller?.sellerProfile?.avgRating || 0} size="sm" />
              <span className="text-sm text-gray-500">({service.seller?.sellerProfile?.totalReviews})</span>
            </div>
          </Link>

          {/* Images */}
          {service.images?.length > 0 && (
            <div>
              <img
                src={service.images[activeImage]}
                alt={service.title}
                className="w-full aspect-video object-cover rounded-xl"
              />
              {service.images.length > 1 && (
                <div className="flex gap-2 mt-2">
                  {service.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-12 rounded-lg overflow-hidden border-2 ${activeImage === i ? 'border-primary-500' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{t('detail.aboutService')}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{service.description}</p>
          </div>

          {/* Tags */}
          {service.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {service.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* Seller details */}
          <div className="card p-4">
            <h2 className="font-bold text-gray-900 mb-3">{t('detail.aboutSeller')}</h2>
            <div className="flex items-start gap-4">
              <Link to={`/sellers/${service.sellerId}`}>
                <Avatar src={service.seller?.avatar} name={service.seller?.name} size="lg" />
              </Link>
              <div className="flex-1">
                <Link to={`/sellers/${service.sellerId}`} className="font-semibold hover:text-primary-600">{service.seller?.name}</Link>
                <p className="text-sm text-gray-500">{service.seller?.bio}</p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <span className="text-gray-400">{t('detail.location')}</span><br />
                    <span className="font-medium">{service.seller?.location || service.location || t('detail.notSpecified')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('detail.responseTime')}</span><br />
                    <span className="font-medium">{service.seller?.sellerProfile?.responseTime || t('detail.na')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('detail.ordersCompleted')}</span><br />
                    <span className="font-medium">{service.seller?.sellerProfile?.totalOrders || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('detail.memberSince')}</span><br />
                    <span className="font-medium">{new Date(service.seller?.sellerProfile?.memberSince).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t('detail.reviews')} ({service.seller?.sellerProfile?.totalReviews})
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar src={review.buyer?.avatar} name={review.buyer?.name} size="sm" />
                      <span className="font-medium text-sm">{review.buyer?.name}</span>
                      <StarRating value={review.rating} size="sm" />
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    {review.sellerReply && (
                      <div className="mt-2 pl-3 border-l-2 border-primary-200">
                        <p className="text-xs text-primary-600 font-medium mb-1">{t('detail.sellerReply')}</p>
                        <p className="text-sm text-gray-600">{review.sellerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Order panel ────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            {/* Package tabs */}
            {service.packages?.length > 0 && (
              <div className="flex border-b border-gray-200">
                {service.packages.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPackage(i)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${selectedPackage === i ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {p.name}
                    {p.isPopular && <span className="ml-1 text-xs text-accent-500">★</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="p-5">
              {pkg ? (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                    <span className="text-2xl font-bold text-gray-900">${parseFloat(pkg.price).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    <span>🕐 {pkg.deliveryDays} {pkg.deliveryDays > 1 ? t('detail.daysPlural') : t('detail.days')}</span>
                    <span>🔄 {pkg.revisions} {pkg.revisions !== 1 ? t('detail.revisionsPlural') : t('detail.revision')}</span>
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {pkg.features?.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-primary-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="mb-4">
                  <p className="text-2xl font-bold">${parseFloat(service.basePrice).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{service.deliveryDays} {t('detail.daysPlural')} delivery</p>
                </div>
              )}

              {/* Order CTA */}
              {service.sellerId !== user?.id ? (
                <button onClick={handleOrder} className="btn-primary w-full mb-2">
                  {t('detail.continue')} (${parseFloat(pkg?.price || service.basePrice).toFixed(2)})
                </button>
              ) : (
                <div className="text-center text-sm text-gray-400 mb-2">{t('detail.ownService')}</div>
              )}
              <button onClick={handleContact} className="btn-secondary w-full text-sm">
                {t('detail.contactSeller')}
              </button>

              {/* Service info */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>{t('detail.location')}</span>
                  <span>{service.isRemote ? t('detail.remote') : service.location || t('detail.inPerson')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('detail.availability')}</span>
                  <span>{service.availability?.hours || t('detail.contactForDetails')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
