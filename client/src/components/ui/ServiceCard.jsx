import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar from './Avatar';
import StarRating from './StarRating';

export default function ServiceCard({ service }) {
  const { t } = useTranslation();
  const { id, title, images, basePrice, seller, niche, packages } = service;
  const lowestPrice = packages?.[0]?.price || basePrice;
  const avgRating = seller?.sellerProfile?.avgRating || 0;
  const totalReviews = seller?.sellerProfile?.totalReviews || 0;

  return (
    <Link
      to={`/services/${id}`}
      className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block"
    >
      {/* Image — shorter on mobile (4:3), 16:9 on desktop */}
      <div className="aspect-[4/3] sm:aspect-video bg-gradient-to-br from-primary-50 to-violet-50 overflow-hidden relative">
        {images?.[0] ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl sm:text-5xl">{niche?.icon || '🛠️'}</span>
          </div>
        )}
        {/* Niche badge — hidden on mobile to save space */}
        {niche && (
          <div className="absolute top-2 left-2 hidden sm:block">
            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2 py-1 rounded-lg shadow-sm">
              {niche.icon} {t('niches.' + niche.slug.replace(/-/g, '_'), { defaultValue: niche.name })}
            </span>
          </div>
        )}
        {/* On mobile: just the icon badge */}
        {niche && (
          <div className="absolute top-1.5 left-1.5 sm:hidden">
            <span className="bg-white/90 text-xs px-1.5 py-0.5 rounded-md shadow-sm font-semibold">
              {niche.icon}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2.5 sm:p-4">
        {/* Seller — compact on mobile */}
        <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2.5">
          <Avatar src={seller?.avatar} name={seller?.name || '?'} size="sm" className="w-4 h-4 sm:w-6 sm:h-6 text-[8px] sm:text-xs" />
          <span className="text-[10px] sm:text-sm text-gray-500 font-medium truncate">{seller?.name}</span>
        </div>

        {/* Title */}
        <h3 className="text-[11px] sm:text-sm font-bold text-gray-900 line-clamp-2 mb-1.5 sm:mb-3 leading-snug group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        {/* Rating + Price */}
        <div className="flex items-center justify-between pt-1.5 sm:pt-3 border-t border-gray-50">
          {totalReviews > 0 ? (
            <div className="flex items-center gap-1">
              <StarRating value={avgRating} size="sm" />
              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">({totalReviews})</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-300">{t('card.noReviews')}</span>
          )}
          <div className="text-right">
            <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">{t('card.from')} </span>
            <span className="text-xs sm:text-sm font-black text-gray-900">${parseFloat(lowestPrice).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
