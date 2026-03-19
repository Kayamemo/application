// ============================================================
// Explore Page — clean mobile bottom sheet + desktop sidebar
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { servicesAPI, nichesAPI } from '../services/api';
import { useGeoFilter } from '../hooks/useGeoFilter';
import ServiceCard from '../components/ui/ServiceCard';
import BackButton from '../components/ui/BackButton';
import toast from 'react-hot-toast';

const RADIUS_OPTIONS = [
  { value: '5', label: '5 km' }, { value: '10', label: '10 km' },
  { value: '25', label: '25 km' }, { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
];

const PRICE_PRESETS = [
  { label: 'Any',      min: '',    max: '' },
  { label: '< $25',    min: '',    max: '25' },
  { label: '$25–$50',  min: '25',  max: '50' },
  { label: '$50–$100', min: '50',  max: '100' },
  { label: '$100+',    min: '100', max: '' },
];

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const a = data.address || {};
    return a.city || a.town || a.village || a.county || data.display_name?.split(',')[0] || 'My location';
  } catch { return 'My location'; }
}

async function forwardGeocode(query) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data[0]) throw new Error('Location not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name.split(',')[0] };
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { coords, locationLabel, radius, setLocation, setRadius, clearLocation } = useGeoFilter();
  const [locationInput, setLocationInput] = useState(locationLabel);
  useEffect(() => { setLocationInput(locationLabel); }, [locationLabel]);

  useEffect(() => {
    const lat = searchParams.get('lat'), lng = searchParams.get('lng'), r = searchParams.get('radius');
    if (lat && lng) {
      setLocation({ lat: parseFloat(lat), lng: parseFloat(lng), label: locationLabel || 'Selected area', radius: r || radius });
      const p = new URLSearchParams(searchParams);
      p.delete('lat'); p.delete('lng'); p.delete('radius');
      setSearchParams(p, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const q        = searchParams.get('q')        || '';
  const niche    = searchParams.get('niche')    || '';
  const sort     = searchParams.get('sort')     || 'createdAt';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const remote   = searchParams.get('remote')   || '';

  useEffect(() => { setPage(1); }, [q, niche, sort, minPrice, maxPrice, remote, coords, radius]);

  const { data: niches = [] } = useQuery({
    queryKey: ['niches'],
    queryFn: () => nichesAPI.list().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['services', q, niche, sort, minPrice, maxPrice, remote, coords, radius, page],
    queryFn: () => servicesAPI.search({
      q, niche, sort, minPrice, maxPrice, remote, page, limit: 12,
      ...(coords ? { lat: coords.lat, lng: coords.lng, radius } : {}),
    }).then((r) => r.data),
    keepPreviousData: true,
  });

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };

  const setPresetPrice = (preset) => {
    const p = new URLSearchParams(searchParams);
    if (preset.min) p.set('minPrice', preset.min); else p.delete('minPrice');
    if (preset.max) p.set('maxPrice', preset.max); else p.delete('maxPrice');
    setSearchParams(p);
  };

  const clearAllFilters = () => {
    const p = new URLSearchParams(searchParams);
    ['niche','sort','minPrice','maxPrice','remote'].forEach(k => p.delete(k));
    setSearchParams(p);
    clearLocation();
  };

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const label = await reverseGeocode(c.latitude, c.longitude);
        setLocation({ lat: c.latitude, lng: c.longitude, label, radius });
        setLocationInput(label);
        setGeoLoading(false);
        toast.success(`Location: ${label}`);
      },
      () => { toast.error('Could not get location. Try typing a city.'); setGeoLoading(false); },
      { timeout: 8000 }
    );
  }, [radius, setLocation]);

  const handleLocationSearch = async (e) => {
    e?.preventDefault();
    if (!locationInput.trim()) { clearLocation(); return; }
    setGeoLoading(true);
    try {
      const result = await forwardGeocode(locationInput.trim());
      setLocation({ lat: result.lat, lng: result.lng, label: result.label, radius });
      setLocationInput(result.label);
    } catch { toast.error('Location not found.'); }
    finally { setGeoLoading(false); }
  };

  const SORT_OPTIONS = [
    { value: 'createdAt', label: t('explore.sort.newest') },
    { value: 'rating',    label: t('explore.sort.topRated') },
    { value: 'price_asc', label: t('explore.sort.priceLow') },
    { value: 'price_desc',label: t('explore.sort.priceHigh') },
  ];

  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => { setSearchInput(q); }, [q]);
  const handleSearch = (e) => { e.preventDefault(); updateParam('q', searchInput.trim()); };

  const activePreset = PRICE_PRESETS.find(pr => pr.min === minPrice && pr.max === maxPrice);
  const activeFilterCount = [niche, minPrice || maxPrice, coords, remote === 'true'].filter(Boolean).length;

  const resultTitle = q
    ? t('explore.resultsFor', { q })
    : niche
      ? (() => { const f = niches.find(n => n.slug === niche); return f ? `${t('niches.' + f.slug.replace(/-/g,'_'), { defaultValue: f.name })} ${t('explore.services')}` : t('explore.allServices'); })()
      : t('explore.allServices');

  // Shared price pills used in both sheet and sidebar
  const PricePills = () => (
    <div className="flex flex-wrap gap-2">
      {PRICE_PRESETS.map((pr) => {
        const on = pr.min === minPrice && pr.max === maxPrice;
        return (
          <button key={pr.label} onClick={() => setPresetPrice(pr)}
            className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${on ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
            {pr.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-4">
        <BackButton />
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder={t('hero.searchPlaceholder')} className="input flex-1" />
          <button type="submit" className="btn-primary px-4 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Mobile: category chips + filter button */}
      <div className="md:hidden mb-4">
        <div className="flex items-center gap-2">
          {/* Category chips — scrollable */}
          <div className="flex gap-2 overflow-x-auto flex-1 pb-1 -mr-4 pr-4" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => updateParam('niche', '')}
              className={`shrink-0 text-xs px-3 py-2 rounded-full border font-semibold transition-all ${!niche ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              {t('explore.all')}
            </button>
            {niches.map(n => (
              <button key={n.id} onClick={() => updateParam('niche', niche === n.slug ? '' : n.slug)}
                className={`shrink-0 text-xs px-3 py-2 rounded-full border font-semibold transition-all whitespace-nowrap ${niche === n.slug ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                {n.icon} {t('niches.' + n.slug.replace(/-/g,'_'), { defaultValue: n.name })}
              </button>
            ))}
          </div>
          {/* Filter button */}
          <button onClick={() => setSheetOpen(true)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition-all ${activeFilterCount > 0 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
            </svg>
            {t('explore.filters')}
            {activeFilterCount > 0 && <span className="bg-white text-primary-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {/* ── Mobile bottom sheet ── */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{t('explore.filters')}</h3>
              <button onClick={clearAllFilters} className="text-sm text-primary-600 font-semibold">
                {t('explore.clearAll') || 'Clear all'}
              </button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

              {/* Sort */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('explore.sort.label') || 'Sort by'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => updateParam('sort', o.value)}
                      className={`text-sm py-2.5 px-3 rounded-xl border font-medium text-left transition-all ${sort === o.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('explore.priceRange')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRICE_PRESETS.map(pr => {
                    const on = pr.min === minPrice && pr.max === maxPrice;
                    return (
                      <button key={pr.label} onClick={() => setPresetPrice(pr)}
                        className={`text-sm py-2.5 rounded-xl border font-medium transition-all ${on ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                        {pr.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('explore.location')}</p>
                <form onSubmit={handleLocationSearch} className="flex gap-2 mb-2">
                  <input value={locationInput} onChange={e => setLocationInput(e.target.value)}
                    placeholder={t('explore.cityPlaceholder')} className="input flex-1 text-sm" />
                  <button type="submit" disabled={geoLoading} className="btn-primary px-3 text-sm shrink-0">
                    {geoLoading ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '→'}
                  </button>
                </form>
                <button onClick={useMyLocation} disabled={geoLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('explore.useMyLocation')}
                </button>
                {coords && (
                  <div className="mt-2 flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2">
                    <span className="text-sm font-medium text-indigo-700 truncate">📍 {locationLabel}</span>
                    <button onClick={clearLocation} className="text-indigo-400 hover:text-indigo-600 ml-2 font-bold">✕</button>
                  </div>
                )}
                {coords && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {RADIUS_OPTIONS.map(r => (
                      <button key={r.value} onClick={() => setRadius(r.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${radius === r.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-500'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Remote */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('explore.remoteOnly')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Online / remote services</p>
                </div>
                <button onClick={() => updateParam('remote', remote === 'true' ? '' : 'true')}
                  className={`w-12 h-6 rounded-full transition-all relative ${remote === 'true' ? 'bg-primary-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${remote === 'true' ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Done button */}
            <div className="px-5 pb-6 pt-3 border-t border-gray-100">
              <button onClick={() => setSheetOpen(false)} className="btn-primary w-full py-3 text-base">
                {t('explore.showResults') || `Show ${data?.pagination?.total || ''} results`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="card p-4 space-y-5 sticky top-20">
            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('explore.category')}</p>
              <div className="space-y-0.5">
                <button onClick={() => updateParam('niche', '')}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${!niche ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {t('explore.all')}
                </button>
                {niches.map(n => (
                  <button key={n.id} onClick={() => updateParam('niche', n.slug)}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${niche === n.slug ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {n.icon} {t('niches.' + n.slug.replace(/-/g,'_'), { defaultValue: n.name })}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('explore.location')}</p>
              <form onSubmit={handleLocationSearch} className="flex gap-1 mb-2">
                <input value={locationInput} onChange={e => setLocationInput(e.target.value)}
                  placeholder={t('explore.cityPlaceholder')} className="input text-sm flex-1 min-w-0" />
                <button type="submit" disabled={geoLoading} className="btn-secondary text-xs px-2 shrink-0">
                  {geoLoading ? <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : '→'}
                </button>
              </form>
              <button onClick={useMyLocation} disabled={geoLoading}
                className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('explore.useMyLocation')}
              </button>
              {coords && (
                <div className="mt-2 flex items-center justify-between bg-indigo-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-medium text-indigo-700 truncate">{locationLabel}</span>
                  <button onClick={clearLocation} className="text-indigo-400 hover:text-indigo-600 ml-1">✕</button>
                </div>
              )}
              {coords && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {RADIUS_OPTIONS.map(r => (
                    <button key={r.value} onClick={() => setRadius(r.value)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${radius === r.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('explore.priceRange')}</p>
              <PricePills />
            </div>

            {/* Remote */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remote" checked={remote === 'true'} onChange={e => updateParam('remote', e.target.checked ? 'true' : '')} className="rounded border-gray-300" />
              <label htmlFor="remote" className="text-sm text-gray-700">{t('explore.remoteOnly')}</label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h1 className="font-bold text-gray-900 text-sm sm:text-base">
                {resultTitle}
                {coords && <span className="ml-2 text-sm font-normal text-indigo-600">{t('explore.nearLabel', { location: locationLabel })}</span>}
              </h1>
              <p className="text-xs text-gray-400">{t('explore.servicesFound', { count: data?.pagination?.total || 0 })}</p>
            </div>
            <select value={sort} onChange={e => updateParam('sort', e.target.value)} className="hidden md:block input w-auto text-sm">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[4/3] sm:aspect-video bg-gray-200 rounded-t-xl" />
                  <div className="p-2.5 sm:p-4 space-y-2">
                    <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.services?.length ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {data.services.map(s => <ServiceCard key={s.id} service={s} />)}
              </div>
              {data.pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">{t('explore.prev')}</button>
                  <span className="flex items-center text-sm text-gray-600">{t('explore.page')} {page} {t('explore.of')} {data.pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page >= data.pagination.pages} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">{t('explore.next')}</button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-medium">{t('explore.noServices')}</p>
              <p className="text-sm mt-1">{coords ? t('explore.noServicesGeo', { radius, location: locationLabel }) : t('explore.noServicesTip')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
