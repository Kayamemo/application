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
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block"
    >
      {/* Image */}
      <div className="aspect-video bg-gradient-to-br from-primary-50 to-violet-50 overflow-hidden relative">
        {images?.[0] ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-5xl">{niche?.icon || '🛠️'}</span>
          </div>
        )}
        {/* Niche badge */}
        {niche && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2 py-1 rounded-lg shadow-sm">
              {niche.icon} {t('niches.' + niche.slug.replace(/-/g, '_'), { defaultValue: niche.name })}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Seller */}
        <div className="flex items-center gap-2 mb-2.5">
          <Avatar src={seller?.avatar} name={seller?.name || '?'} size="sm" />
          <span className="text-sm text-gray-500 font-medium truncate">{seller?.name}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 leading-snug group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        {/* Rating + Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          {totalReviews > 0 ? (
            <div className="flex items-center gap-1">
              <StarRating value={avgRating} size="sm" />
              <span className="text-xs text-gray-400 font-medium">({totalReviews})</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">{t('card.noReviews')}</span>
          )}
          <div className="text-right">
            <span className="text-xs text-gray-400">{t('card.from')} </span>
            <span className="font-black text-gray-900">${parseFloat(lowestPrice).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
