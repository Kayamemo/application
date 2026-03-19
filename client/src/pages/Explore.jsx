import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { servicesAPI, nichesAPI } from '../services/api';
import { useGeoFilter } from '../hooks/useGeoFilter';
import ServiceCard from '../components/ui/ServiceCard';
import BackButton from '../components/ui/BackButton';
import toast from 'react-hot-toast';

const RADIUS_OPTIONS = [
  { value: '5',  label: '5 km'  },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
];

const PRICE_PRESETS = [
  { label: 'Any price',  min: '',    max: '',   },
  { label: 'Under $25',  min: '',    max: '25'  },
  { label: '$25 – $50',  min: '25',  max: '50'  },
  { label: '$50 – $100', min: '50',  max: '100' },
  { label: '$100+',      min: '100', max: ''    },
];

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await r.json();
    const a = d.address || {};
    return a.city || a.town || a.village || a.county || d.display_name?.split(',')[0] || 'My location';
  } catch { return 'My location'; }
}

async function forwardGeocode(query) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const d = await r.json();
  if (!d[0]) throw new Error('Not found');
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), label: d[0].display_name.split(',')[0] };
}

// ── Focused bottom sheet (small, per-filter) ─────────────────
function Sheet({ title, onClose, children }) {
  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl animate-fade-up">
        {/* handle */}
        <div className="flex justify-center pt-3 pb-0">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
          <span className="font-bold text-gray-900 text-base">{title}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [page, setPage]           = useState(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [sheet, setSheet]         = useState(null); // 'sort' | 'price' | 'location'
  const [searchInput, setSearchInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const { coords, locationLabel, radius, setLocation, setRadius, clearLocation } = useGeoFilter();

  // sync from URL
  const q        = searchParams.get('q')        || '';
  const niche    = searchParams.get('niche')    || '';
  const sort     = searchParams.get('sort')     || 'createdAt';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const remote   = searchParams.get('remote')   || '';

  useEffect(() => { setSearchInput(q); }, [q]);
  useEffect(() => { setLocationInput(locationLabel); }, [locationLabel]);
  useEffect(() => { setPage(1); }, [q, niche, sort, minPrice, maxPrice, remote, coords, radius]);

  // consume lat/lng from URL (set by map or other pages)
  useEffect(() => {
    const lat = searchParams.get('lat'), lng = searchParams.get('lng'), r = searchParams.get('radius');
    if (lat && lng) {
      setLocation({ lat: parseFloat(lat), lng: parseFloat(lng), label: 'Selected area', radius: r || radius });
      const p = new URLSearchParams(searchParams);
      p.delete('lat'); p.delete('lng'); p.delete('radius');
      setSearchParams(p, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: niches = [] } = useQuery({
    queryKey: ['niches'],
    queryFn: () => nichesAPI.list().then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['services', q, niche, sort, minPrice, maxPrice, remote, coords, radius, page],
    queryFn: () => servicesAPI.search({
      q, niche, sort, minPrice, maxPrice, remote, page, limit: 12,
      ...(coords ? { lat: coords.lat, lng: coords.lng, radius } : {}),
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const set = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };

  const setPrice = (pr) => {
    const p = new URLSearchParams(searchParams);
    if (pr.min) p.set('minPrice', pr.min); else p.delete('minPrice');
    if (pr.max) p.set('maxPrice', pr.max); else p.delete('maxPrice');
    setSearchParams(p);
  };

  const handleSearch = (e) => { e.preventDefault(); set('q', searchInput.trim()); };

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const label = await reverseGeocode(c.latitude, c.longitude);
        setLocation({ lat: c.latitude, lng: c.longitude, label, radius });
        setLocationInput(label);
        setGeoLoading(false);
        setSheet(null);
        toast.success(`📍 ${label}`);
      },
      () => { toast.error('Could not get your location'); setGeoLoading(false); },
      { timeout: 8000 }
    );
  }, [radius, setLocation]);

  const handleLocationSubmit = async (e) => {
    e?.preventDefault();
    if (!locationInput.trim()) { clearLocation(); setSheet(null); return; }
    setGeoLoading(true);
    try {
      const r = await forwardGeocode(locationInput.trim());
      setLocation({ lat: r.lat, lng: r.lng, label: r.label, radius });
      setLocationInput(r.label);
      setSheet(null);
      toast.success(`📍 ${r.label}`);
    } catch { toast.error('Location not found'); }
    finally { setGeoLoading(false); }
  };

  const SORT_OPTIONS = [
    { value: 'createdAt',  label: t('explore.sort.newest'),    icon: '✨' },
    { value: 'rating',     label: t('explore.sort.topRated'),  icon: '⭐' },
    { value: 'price_asc',  label: t('explore.sort.priceLow'),  icon: '↑' },
    { value: 'price_desc', label: t('explore.sort.priceHigh'), icon: '↓' },
  ];

  const activePrice  = PRICE_PRESETS.find(pr => pr.min === minPrice && pr.max === maxPrice);
  const activeSortOpt = SORT_OPTIONS.find(o => o.value === sort);
  const priceLabel   = activePrice?.label || 'Price';
  const sortLabel    = activeSortOpt?.label || 'Newest';
  const locLabel     = coords ? locationLabel : 'Everywhere';

  const priceActive  = !!(minPrice || maxPrice);
  const locActive    = !!coords;

  // derived title
  const activeNiche  = niches.find(n => n.slug === niche);
  const resultTitle  = q
    ? `"${q}"`
    : activeNiche
      ? `${activeNiche.icon} ${t('niches.' + activeNiche.slug.replace(/-/g,'_'), { defaultValue: activeNiche.name })}`
      : t('explore.allServices');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-4 pt-3 pb-2">

        {/* Search row */}
        <div className="flex items-center gap-2 mb-3">
          <BackButton />
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('hero.searchPlaceholder')}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(''); set('q', ''); }}
                className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </form>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>

          {/* Category dropdown */}
          <button
            onClick={() => setSheet(sheet === 'category' ? null : 'category')}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              niche ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {activeNiche ? `${activeNiche.icon} ${t('niches.' + activeNiche.slug.replace(/-/g,'_'), { defaultValue: activeNiche.name })}` : t('explore.category')}
            <svg className="w-3 h-3 ml-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Sort */}
          <button
            onClick={() => setSheet(sheet === 'sort' ? null : 'sort')}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700"
          >
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M10 17h4" />
            </svg>
            {sortLabel}
          </button>

          {/* Price */}
          <button
            onClick={() => setSheet(sheet === 'price' ? null : 'price')}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              priceActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            💰 {priceLabel}
          </button>

          {/* Location */}
          <button
            onClick={() => setSheet(sheet === 'location' ? null : 'location')}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              locActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            📍 {locLabel}
          </button>

          {/* Remote */}
          <button
            onClick={() => set('remote', remote === 'true' ? '' : 'true')}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              remote === 'true' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            🌐 Remote
          </button>

        </div>
      </div>

      {/* ── Results area ── */}
      <div className="px-4 pt-3 pb-6 max-w-7xl mx-auto">

        {/* Count */}
        <p className="text-xs text-gray-400 mb-3">
          <span className="font-semibold text-gray-700">{data?.pagination?.total || 0}</span> services
          {q || niche ? ` · ${resultTitle}` : ''}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.services?.length ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.services.map(s => <ServiceCard key={s.id} service={s} />)}
            </div>
            {data.pagination.pages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary px-5 py-2 text-sm disabled:opacity-40">
                  ← {t('explore.prev')}
                </button>
                <span className="flex items-center text-sm text-gray-500">
                  {page} / {data.pagination.pages}
                </span>
                <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page >= data.pagination.pages}
                  className="btn-secondary px-5 py-2 text-sm disabled:opacity-40">
                  {t('explore.next')} →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="font-bold text-gray-700 text-lg">{t('explore.noServices')}</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {coords ? t('explore.noServicesGeo', { radius, location: locationLabel }) : t('explore.noServicesTip')}
            </p>
          </div>
        )}
      </div>

      {/* ── Category sheet ── */}
      {sheet === 'category' && (
        <Sheet title={t('explore.category')} onClose={() => setSheet(null)}>
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">
            <button
              onClick={() => { set('niche', ''); setSheet(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all text-left ${
                !niche ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">🔍</span>
              All categories
              {!niche && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </button>
            {niches.map(n => (
              <button
                key={n.id}
                onClick={() => { set('niche', n.slug); setSheet(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all text-left ${
                  niche === n.slug ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{n.icon}</span>
                {t('niches.' + n.slug.replace(/-/g,'_'), { defaultValue: n.name })}
                {niche === n.slug && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* ── Sort sheet ── */}
      {sheet === 'sort' && (
        <Sheet title="Sort by" onClose={() => setSheet(null)}>
          <div className="space-y-1">
            {SORT_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => { set('sort', o.value); setSheet(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all text-left ${
                  sort === o.value ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{o.icon}</span>
                {o.label}
                {sort === o.value && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* ── Price sheet ── */}
      {sheet === 'price' && (
        <Sheet title="Budget" onClose={() => setSheet(null)}>
          <div className="space-y-1">
            {PRICE_PRESETS.map(pr => {
              const on = pr.min === minPrice && pr.max === maxPrice;
              return (
                <button
                  key={pr.label}
                  onClick={() => { setPrice(pr); setSheet(null); }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                    on ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pr.label}
                  {on && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {/* ── Location sheet ── */}
      {sheet === 'location' && (
        <Sheet title="Location" onClose={() => setSheet(null)}>
          <form onSubmit={handleLocationSubmit} className="flex gap-2 mb-3">
            <input
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              placeholder="Enter city or area..."
              className="input flex-1 text-sm"
              autoFocus
            />
            <button type="submit" disabled={geoLoading} className="btn-primary px-4 text-sm shrink-0">
              {geoLoading
                ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Go'}
            </button>
          </form>
          <button
            onClick={useMyLocation}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Use my location
          </button>
          {coords && (
            <>
              <div className="mt-3 flex items-center justify-between bg-indigo-50 rounded-2xl px-4 py-3">
                <span className="text-sm font-semibold text-indigo-700 truncate">📍 {locationLabel}</span>
                <button onClick={() => { clearLocation(); setSheet(null); }}
                  className="text-xs text-indigo-400 hover:text-indigo-600 ml-3 font-bold shrink-0">
                  Clear
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRadius(r.value)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      radius === r.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </Sheet>
      )}

    </div>
  );
}
