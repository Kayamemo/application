import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar from './Avatar';
import StarRating from './StarRating';

// Each niche gets its own gradient so placeholder cards look branded, not empty
const NICHE_GRADIENTS = {
  'gardening':         'from-emerald-400 to-green-600',
  'craftwork':         'from-amber-400 to-orange-500',
  'tutoring':          'from-blue-400 to-indigo-600',
  'babysitting':       'from-pink-400 to-rose-500',
  'cleaning':          'from-cyan-400 to-teal-600',
  'pet-care':          'from-yellow-400 to-amber-500',
  'photography':       'from-violet-400 to-purple-600',
  'personal-training': 'from-red-400 to-orange-600',
  'home-repairs':      'from-slate-500 to-gray-700',
  'cooking':           'from-orange-400 to-red-500',
};

// Fallback for unknown niches — rotate through a set of nice colors
const FALLBACK_GRADIENTS = [
  'from-indigo-400 to-blue-600',
  'from-teal-400 to-cyan-600',
  'from-fuchsia-400 to-pink-600',
  'from-lime-400 to-green-600',
];

function getGradient(niche) {
  if (!niche) return 'from-indigo-400 to-blue-600';
  if (NICHE_GRADIENTS[niche.slug]) return NICHE_GRADIENTS[niche.slug];
  // Deterministic fallback based on slug length
  return FALLBACK_GRADIENTS[niche.slug.length % FALLBACK_GRADIENTS.length];
}

export default function ServiceCard({ service }) {
  const { t } = useTranslation();
  const { id, title, images, basePrice, seller, niche, packages } = service;
  const lowestPrice = packages?.[0]?.price || basePrice;
  const avgRating = seller?.sellerProfile?.avgRating || 0;
  const totalReviews = seller?.sellerProfile?.totalReviews || 0;
  const gradient = getGradient(niche);

  return (
    <Link
      to={`/services/${id}`}
      className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block"
    >
      {/* Image / Placeholder */}
      <div className="aspect-[4/3] sm:aspect-video overflow-hidden relative">
        {images?.[0] ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Branded placeholder: category color + emoji + title text
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1.5 px-3 relative overflow-hidden`}>
            {/* Decorative circle in corner */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-white/10 rounded-full" />
            <span className="text-3xl sm:text-4xl drop-shadow-sm relative z-10">{niche?.icon || '🛠️'}</span>
            <p className="text-white font-bold text-[10px] sm:text-xs text-center leading-tight line-clamp-2 relative z-10 px-1 drop-shadow">
              {title}
            </p>
          </div>
        )}
        {/* Niche badge — desktop only */}
        {niche && images?.[0] && (
          <div className="absolute top-2 left-2 hidden sm:block">
            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2 py-1 rounded-lg shadow-sm">
              {niche.icon} {t('niches.' + niche.slug.replace(/-/g, '_'), { defaultValue: niche.name })}
            </span>
          </div>
        )}
        {/* Mobile: emoji badge only when there IS an image */}
        {niche && images?.[0] && (
          <div className="absolute top-1.5 left-1.5 sm:hidden">
            <span className="bg-white/90 text-xs px-1.5 py-0.5 rounded-md shadow-sm font-semibold">
              {niche.icon}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2.5 sm:p-4">
        {/* Seller */}
        <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2.5">
          <Avatar src={seller?.avatar} name={seller?.name || '?'} size="sm" />
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
