// ============================================================
// Explore Page — Fiverr-style: chips row + filter pill dropdowns
// ============================================================
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

// Pill button — shown in the filter row
function FilterPill({ label, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-semibold transition-all whitespace-nowrap ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
      }`}
    >
      {label}
      <svg className={`w-3.5 h-3.5 transition-transform ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

// Small dropdown card that appears below a pill
function Dropdown({ children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute left-0 top-full mt-2 z-40 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 min-w-[220px] animate-fade-up">
      {children}
    </div>
  );
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'sort' | 'price' | 'location' | null

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

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const label = await reverseGeocode(c.latitude, c.longitude);
        setLocation({ lat: c.latitude, lng: c.longitude, label, radius });
        setLocationInput(label);
        setGeoLoading(false);
        setOpenDropdown(null);
        toast.success(`📍 ${label}`);
      },
      () => { toast.error('Could not get location. Try typing a city.'); setGeoLoading(false); },
      { timeout: 8000 }
    );
  }, [radius, setLocation]);

  const handleLocationSearch = async (e) => {
    e?.preventDefault();
    if (!locationInput.trim()) { clearLocation(); setOpenDropdown(null); return; }
    setGeoLoading(true);
    try {
      const result = await forwardGeocode(locationInput.trim());
      setLocation({ lat: result.lat, lng: result.lng, label: result.label, radius });
      setLocationInput(result.label);
      setOpenDropdown(null);
      toast.success(`📍 ${result.label}`);
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

  const activePrice  = PRICE_PRESETS.find(pr => pr.min === minPrice && pr.max === maxPrice);
  const activeSort   = SORT_OPTIONS.find(o => o.value === sort);
  const priceActive  = !!(minPrice || maxPrice);
  const locationActive = !!coords;

  const toggle = (name) => setOpenDropdown(prev => prev === name ? null : name);

  const resultTitle = q
    ? t('explore.resultsFor', { q })
    : niche
      ? (() => { const f = niches.find(n => n.slug === niche); return f ? `${t('niches.' + f.slug.replace(/-/g,'_'), { defaultValue: f.name })} ${t('explore.services')}` : t('explore.allServices'); })()
      : t('explore.allServices');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

      {/* ── Search bar ── */}
      <div className="flex items-center gap-2 mb-4">
        <BackButton />
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('hero.searchPlaceholder')}
            className="input flex-1"
          />
          <button type="submit" className="btn-primary px-4 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {/* ── Category chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => updateParam('niche', '')}
          className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
            !niche ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          }`}
        >
          {t('explore.all')}
        </button>
        {niches.map(n => (
          <button
            key={n.id}
            onClick={() => updateParam('niche', niche === n.slug ? '' : n.slug)}
            className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all whitespace-nowrap ${
              niche === n.slug ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            {n.icon} {t('niches.' + n.slug.replace(/-/g,'_'), { defaultValue: n.name })}
          </button>
        ))}
      </div>

      {/* ── Filter pill row ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>

        {/* Sort */}
        <div className="relative shrink-0">
          <FilterPill
            label={activeSort?.label || t('explore.sort.label')}
            active={openDropdown === 'sort'}
            onClick={() => toggle('sort')}
          />
          {openDropdown === 'sort' && (
            <Dropdown onClose={() => setOpenDropdown(null)}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t('explore.sort.label') || 'Sort by'}</p>
              <div className="space-y-1">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => { updateParam('sort', o.value); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      sort === o.value ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Dropdown>
          )}
        </div>

        {/* Budget */}
        <div className="relative shrink-0">
          <FilterPill
            label={priceActive ? (activePrice?.label || 'Budget') : 'Budget'}
            active={priceActive || openDropdown === 'price'}
            onClick={() => toggle('price')}
          />
          {openDropdown === 'price' && (
            <Dropdown onClose={() => setOpenDropdown(null)}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Budget</p>
              <div className="space-y-1">
                {PRICE_PRESETS.map(pr => {
                  const on = pr.min === minPrice && pr.max === maxPrice;
                  return (
                    <button
                      key={pr.label}
                      onClick={() => { setPresetPrice(pr); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        on ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pr.label}
                    </button>
                  );
                })}
              </div>
            </Dropdown>
          )}
        </div>

        {/* Location */}
        <div className="relative shrink-0">
          <FilterPill
            label={locationActive ? `📍 ${locationLabel}` : '📍 Location'}
            active={locationActive || openDropdown === 'location'}
            onClick={() => toggle('location')}
          />
          {openDropdown === 'location' && (
            <Dropdown onClose={() => setOpenDropdown(null)}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Location</p>
              <form onSubmit={handleLocationSearch} className="flex gap-2 mb-3">
                <input
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  placeholder={t('explore.cityPlaceholder')}
                  className="input flex-1 text-sm"
                  autoFocus
                />
                <button type="submit" disabled={geoLoading} className="btn-primary px-3 text-sm shrink-0">
                  {geoLoading
                    ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : '→'}
                </button>
              </form>
              <button
                onClick={useMyLocation}
                disabled={geoLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('explore.useMyLocation')}
              </button>
              {coords && (
                <>
                  <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-sm font-medium text-gray-700 truncate">📍 {locationLabel}</span>
                    <button onClick={() => { clearLocation(); }} className="text-gray-400 hover:text-gray-600 ml-2 font-bold text-xs">✕ Clear</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {RADIUS_OPTIONS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setRadius(r.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          radius === r.value ? 'border-gray-900 bg-gray-900 text-white font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </Dropdown>
          )}
        </div>

        {/* Remote toggle pill */}
        <button
          onClick={() => updateParam('remote', remote === 'true' ? '' : 'true')}
          className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
            remote === 'true' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          }`}
        >
          🌐 {t('explore.remoteOnly')}
        </button>

      </div>

      {/* ── Results header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold text-gray-900 text-sm sm:text-base">
            {resultTitle}
            {coords && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                {t('explore.nearLabel', { location: locationLabel })}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('explore.servicesFound', { count: data?.pagination?.total || 0 })}
          </p>
        </div>
      </div>

      {/* ── Results grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {data.services.map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
          {data.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">
                {t('explore.prev')}
              </button>
              <span className="flex items-center text-sm text-gray-600">
                {t('explore.page')} {page} {t('explore.of')} {data.pagination.pages}
              </span>
              <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page >= data.pagination.pages}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">
                {t('explore.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium">{t('explore.noServices')}</p>
          <p className="text-sm mt-1">
            {coords ? t('explore.noServicesGeo', { radius, location: locationLabel }) : t('explore.noServicesTip')}
          </p>
        </div>
      )}
    </div>
  );
}
