// ============================================================
// Explore Page — Search + Filter + Paginated Results
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
  { value: '5',   label: '5 km' },
  { value: '10',  label: '10 km' },
  { value: '25',  label: '25 km' },
  { value: '50',  label: '50 km' },
  { value: '100', label: '100 km' },
];

// Reverse-geocode lat/lng → place name via Nominatim (OpenStreetMap, free)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    return a.city || a.town || a.village || a.county || data.display_name?.split(',')[0] || 'My location';
  } catch {
    return 'My location';
  }
}

// Forward-geocode a place name → { lat, lng } via Nominatim
async function forwardGeocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data[0]) throw new Error('Location not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name.split(',')[0] };
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Shared geo filter state (synced with Navbar via localStorage)
  const { coords, locationLabel, radius, setLocation, setRadius, clearLocation } = useGeoFilter();
  const [locationInput, setLocationInput] = useState(locationLabel);

  // If the navbar search passed lat/lng in URL params, save them to the hook then clean the URL
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const r   = searchParams.get('radius');
    if (lat && lng) {
      setLocation({ lat: parseFloat(lat), lng: parseFloat(lng), label: locationLabel || 'Selected area', radius: r || radius });
      const p = new URLSearchParams(searchParams);
      p.delete('lat'); p.delete('lng'); p.delete('radius');
      setSearchParams(p, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read filters from URL
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

  // Use browser geolocation
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const label = await reverseGeocode(c.latitude, c.longitude);
        setLocation({ lat: c.latitude, lng: c.longitude, label, radius });
        setLocationInput(label);
        setGeoLoading(false);
        toast.success(`Location set to ${label}`);
      },
      () => {
        toast.error('Could not get your location. Please type a city name.');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }, [radius, setLocation]);

  // Search by typed city name
  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!locationInput.trim()) {
      clearLocation();
      return;
    }
    setGeoLoading(true);
    try {
      const result = await forwardGeocode(locationInput.trim());
      setLocation({ lat: result.lat, lng: result.lng, label: result.label, radius });
      setLocationInput(result.label);
    } catch {
      toast.error('Location not found. Try a different city name.');
    } finally {
      setGeoLoading(false);
    }
  };

  const SORT_OPTIONS = [
    { value: 'createdAt',  label: t('explore.sort.newest') },
    { value: 'rating',     label: t('explore.sort.topRated') },
    { value: 'price_asc',  label: t('explore.sort.priceLow') },
    { value: 'price_desc', label: t('explore.sort.priceHigh') },
  ];

  const resultTitle = q
    ? t('explore.resultsFor', { q })
    : niche
      ? (() => {
          const found = niches.find((n) => n.slug === niche);
          const name = found ? t('niches.' + found.slug.replace(/-/g, '_'), { defaultValue: found.name }) : '';
          return `${name} ${t('explore.services')}`;
        })()
      : t('explore.allServices');

  const [searchInput, setSearchInput] = useState(q);

  // Keep search input in sync when URL changes externally
  useEffect(() => { setSearchInput(q); }, [q]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('q', searchInput.trim());
  };

  const activeNiche = niche ? niches.find((n) => n.slug === niche) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Back + Search bar ── */}
      <div className="flex items-center gap-3 mb-3">
        <BackButton />
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('hero.searchPlaceholder')}
          className="input flex-1 text-base"
        />
        <button type="submit" className="btn-primary px-6">
          {t('hero.search')}
        </button>
      </form>

      {/* ── Active filter chips ── */}
      {(q || activeNiche) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {q && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-medium px-3 py-1 rounded-full">
              🔍 {q}
              <button onClick={() => updateParam('q', '')} className="hover:text-indigo-900 ml-0.5 text-lg leading-none">×</button>
            </span>
          )}
          {activeNiche && (
            <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 text-sm font-medium px-3 py-1 rounded-full">
              {activeNiche.icon} {t('niches.' + activeNiche.slug.replace(/-/g, '_'), { defaultValue: activeNiche.name })}
              <button onClick={() => updateParam('niche', '')} className="hover:text-violet-900 ml-0.5 text-lg leading-none">×</button>
            </span>
          )}
        </div>
      )}

      {/* Mobile filter toggle button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {t('explore.filters')}
          {filtersOpen ? ' ▲' : ' ▼'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Sidebar filters ──────────────────────────── */}
        <aside className={`md:w-60 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="card p-4 space-y-5 sticky top-20">
            <h2 className="font-bold text-gray-900">{t('explore.filters')}</h2>

            {/* ── Location + Radius ── */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                {t('explore.location')}
              </label>

              {/* Input row */}
              <form onSubmit={handleLocationSearch} className="flex gap-1 mb-2">
                <input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder={t('explore.cityPlaceholder')}
                  className="input text-sm flex-1 min-w-0"
                />
                <button
                  type="submit"
                  disabled={geoLoading}
                  className="btn-secondary text-xs px-2 py-1 shrink-0"
                  title="Search this location"
                >
                  {geoLoading ? (
                    <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : '→'}
                </button>
              </form>

              {/* "Use my location" button */}
              <button
                onClick={useMyLocation}
                disabled={geoLoading}
                className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border transition-colors"
                style={{ borderColor: '#a5b4fc', color: '#4f46e5' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eef2ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('explore.useMyLocation')}
              </button>

              {/* Active location badge */}
              {coords && (
                <div className="mt-2 flex items-center justify-between bg-indigo-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-medium text-indigo-700 truncate">{locationLabel}</span>
                  <button onClick={clearLocation} className="text-indigo-400 hover:text-indigo-600 ml-1 shrink-0 text-sm leading-none">✕</button>
                </div>
              )}

              {/* Radius selector — only shown when a location is active */}
              {coords && (
                <div className="mt-2">
                  <label className="text-xs text-gray-500 mb-1 block">{t('explore.within')}</label>
                  <div className="grid grid-cols-5 gap-1">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRadius(r.value)}
                        className={`text-xs py-1 rounded-lg border transition-colors ${
                          radius === r.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Category ── */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('explore.category')}</label>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => updateParam('niche', '')}
                  className={`w-full text-left text-sm px-2 py-1 rounded ${!niche ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('explore.all')}
                </button>
                {niches.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => updateParam('niche', n.slug)}
                    className={`w-full text-left text-sm px-2 py-1 rounded ${niche === n.slug ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {n.icon} {t('niches.' + n.slug.replace(/-/g, '_'), { defaultValue: n.name })}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Price range ── */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('explore.priceRange')}</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  placeholder={t('explore.minPlaceholder')}
                  value={minPrice}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  className="input w-full text-sm"
                />
                <input
                  type="number"
                  placeholder={t('explore.maxPlaceholder')}
                  value={maxPrice}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  className="input w-full text-sm"
                />
              </div>
            </div>

            {/* ── Remote ── */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remote"
                checked={remote === 'true'}
                onChange={(e) => updateParam('remote', e.target.checked ? 'true' : '')}
                className="rounded border-gray-300"
              />
              <label htmlFor="remote" className="text-sm text-gray-700">{t('explore.remoteOnly')}</label>
            </div>
          </div>
        </aside>

        {/* ── Results ──────────────────────────────────── */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-bold text-gray-900">
                {resultTitle}
                {coords && <span className="ml-2 text-sm font-normal text-indigo-600">{t('explore.nearLabel', { location: locationLabel })}</span>}
              </h1>
              <p className="text-sm text-gray-500">{t('explore.servicesFound', { count: data?.pagination?.total || 0 })}</p>
            </div>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input w-auto text-sm"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.services?.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.services.map((s) => <ServiceCard key={s.id} service={s} />)}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    {t('explore.prev')}
                  </button>
                  <span className="flex items-center text-sm text-gray-600">
                    {t('explore.page')} {page} {t('explore.of')} {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page >= data.pagination.pages}
                    className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                  >
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
                {coords
                  ? t('explore.noServicesGeo', { radius, location: locationLabel })
                  : t('explore.noServicesTip')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
