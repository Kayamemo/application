// ============================================================
// Public Seller Profile Page
// ============================================================
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersAPI } from '../services/api';
import Avatar from '../components/ui/Avatar';
import BackButton from '../components/ui/BackButton';
import StarRating from '../components/ui/StarRating';
import ServiceCard from '../components/ui/ServiceCard';

export default function SellerProfile() {
  const { id } = useParams();
  const { t } = useTranslation();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => usersAPI.getProfile(id).then((r) => r.data),
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse"><div className="h-32 bg-gray-200 rounded-xl" /></div>;
  if (!seller) return <div className="text-center py-20 text-gray-400">{t('profile.notFound')}</div>;

  const profile = seller.sellerProfile;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4"><BackButton /></div>
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar src={seller.avatar} name={seller.name} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{seller.name}</h1>
            {profile?.tagline && <p className="text-gray-500 mt-0.5">{profile.tagline}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
              {seller.location && <span>📍 {seller.location}</span>}
              {profile?.responseTime && <span>⚡ {profile.responseTime}</span>}
              <div className="flex items-center gap-1">
                <StarRating value={profile?.avgRating || 0} size="sm" />
                <span>({profile?.totalReviews || 0} {t('profile.reviews')})</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: t('profile.orders'),     value: profile?.totalOrders || 0 },
                { label: t('profile.reviews'),    value: profile?.totalReviews || 0 },
                { label: t('profile.completion'), value: `${profile?.completionRate || 100}%` },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-gray-50 rounded-lg py-2">
                  <div className="font-bold text-lg">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        {seller.bio && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h2 className="font-semibold mb-2">{t('profile.about')}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{seller.bio}</p>
          </div>
        )}

        {/* Skills & Languages */}
        <div className="mt-4 flex flex-wrap gap-4">
          {profile?.skills?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{t('profile.skills')}</p>
              <div className="flex flex-wrap gap-1">
                {profile.skills.map((s) => (
                  <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}
          {profile?.languages?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{t('profile.languages')}</p>
              <div className="flex flex-wrap gap-1">
                {profile.languages.map((l) => (
                  <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio images */}
        {profile?.portfolioImages?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('profile.portfolio')}</p>
            <div className="flex gap-2 overflow-x-auto">
              {profile.portfolioImages.map((img, i) => (
                <img key={i} src={img} alt="" className="w-24 h-20 object-cover rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Services */}
      {seller.services?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">{t('profile.services')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {seller.services.map((s) => (
              <ServiceCard key={s.id} service={{ ...s, seller }} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {seller.reviewsReceived?.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">{t('profile.reviewsSection')}</h2>
          <div className="space-y-4">
            {seller.reviewsReceived.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={r.buyer?.avatar} name={r.buyer?.name} size="sm" />
                  <span className="font-medium text-sm">{r.buyer?.name}</span>
                  <StarRating value={r.rating} size="sm" />
                  <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
