import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { nichesAPI, servicesAPI, messagesAPI } from '../services/api';
import { useGeoFilter } from '../hooks/useGeoFilter';
import { useAuth } from '../contexts/AuthContext';
import ServiceCard from '../components/ui/ServiceCard';
import Avatar from '../components/ui/Avatar';
import LangToggle from '../components/ui/LangToggle';
import toast from 'react-hot-toast';

const TRUST_STAT_KEYS = [
  { value: '10K+', key: 'stats.servicesListed' },
  { value: '98%',  key: 'stats.satisfaction' },
  { value: '500+', key: 'stats.sellers' },
];

const RADIUS_OPTIONS = ['5', '10', '25', '50', '100'];

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    return a.city || a.town || a.village || a.county || data.display_name?.split(',')[0] || 'My location';
  } catch { return 'My location'; }
}

async function forwardGeocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data[0]) throw new Error('Location not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name.split(',')[0] };
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsSearched, setSuggestionsSearched] = useState(false);
  const searchRef = useRef(null);

  // Location picker state
  const { coords, locationLabel, radius, setLocation, setRadius, clearLocation } = useGeoFilter();
  const [locOpen, setLocOpen]     = useState(false);
  const [locInput, setLocInput]   = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const locRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (locRef.current      && !locRef.current.contains(e.target))      setLocOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (searchRef.current   && !searchRef.current.contains(e.target))   setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced suggestions fetch
  useEffect(() => {
    if (search.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); setSuggestionsSearched(false); return; }
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      setSuggestionsSearched(false);
      setShowSuggestions(true);
      try {
        const res = await servicesAPI.search({ q: search.trim(), limit: 6 });
        setSuggestions(res.data.services || []);
        setSuggestionsSearched(true);
      } catch {
        setShowSuggestions(false);
      }
      finally { setSuggestionsLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync input with stored label when dropdown opens
  useEffect(() => {
    if (locOpen) setLocInput(locationLabel);
  }, [locOpen, locationLabel]);

  const { data: niches = [] } = useQuery({
    queryKey: ['niches'],
    queryFn: () => nichesAPI.list().then((r) => r.data),
  });

  const { data: featured } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: () => servicesAPI.search({ limit: 8, sort: 'rating' }).then((r) => r.data),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.conversations().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const handleSearch = (e) => {
    e.preventDefault();
    setSuggestions([]); setShowSuggestions(false);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (coords) {
      params.set('lat', coords.lat);
      params.set('lng', coords.lng);
      params.set('radius', radius);
    }
    navigate(`/explore?${params.toString()}`);
  };

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const label = await reverseGeocode(c.latitude, c.longitude);
        setLocation({ lat: c.latitude, lng: c.longitude, label, radius });
        setLocInput(label);
        setGeoLoading(false);
        setLocOpen(false);
        toast.success(`Location set to ${label}`);
      },
      () => { toast.error('Could not get your location'); setGeoLoading(false); },
      { timeout: 8000 }
    );
  }, [radius, setLocation]);

  const handleLocSubmit = async (e) => {
    e?.preventDefault();
    if (!locInput.trim()) { clearLocation(); setLocOpen(false); return; }
    setGeoLoading(true);
    try {
      const result = await forwardGeocode(locInput.trim());
      setLocation({ lat: result.lat, lng: result.lng, label: result.label, radius });
      setLocInput(result.label);
      setLocOpen(false);
    } catch {
      toast.error('Location not found. Try a city name.');
    } finally {
      setGeoLoading(false);
    }
  };

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative bg-indigo-950 text-white overflow-visible">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary-500/10 rounded-full blur-3xl" />
        </div>

        {/* ── Top bar: logo + nav + auth ── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 flex items-center">
          <div className="flex-1">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="text-xl font-black tracking-tight text-white">Kaya</span>
          </Link>
          </div>

          {/* Center nav — desktop only, mirrors mobile bottom nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              {
                to: '/',
                label: t('nav.home') || 'Home',
                active: true,
                icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
              },
              {
                to: '/explore',
                label: t('nav.browse') || 'Explore',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                to: '/messages',
                label: t('nav.messages') || 'Messages',
                badge: unreadCount,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                ),
              },
              ...(user ? [{
                to: (user.role === 'SELLER' || user.role === 'ADMIN') ? '/dashboard/seller' : '/dashboard',
                label: (user.role === 'SELLER' || user.role === 'ADMIN') ? t('nav.navDashboard') || 'Dashboard' : t('nav.myOrders') || 'Orders',
                icon: (user.role === 'SELLER' || user.role === 'ADMIN') ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
              }] : []),
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  item.active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex-1 flex items-center justify-end gap-2" ref={userMenuRef}>
            <LangToggle variant="light" />
            {user ? (
              <>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-1.5 transition-all"
                >
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="text-sm font-medium text-white hidden sm:block">{user.name.split(' ')[0]}</span>
                  <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 card shadow-xl z-50 py-1 overflow-hidden animate-fade-up">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-indigo-500 font-medium capitalize">{user.role.toLowerCase()}</p>
                    </div>
                    {[
                      { to: '/dashboard',        label: `📦 ${t('nav.myOrders')}` },
                      { to: '/explore',           label: `🔍 ${t('nav.browse')}` },
                      ...(user.role === 'SELLER' || user.role === 'ADMIN' ? [{ to: '/dashboard/seller', label: `🛠️ ${t('nav.sellerDash')}` }] : []),
                      ...(user.role === 'ADMIN'  ? [{ to: '/admin',          label: `⚙️ ${t('nav.adminPanel')}` }] : []),
                    ].map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={async () => { await logout(); navigate('/'); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">{t('nav.login')}</Link>
                <Link to="/register" className="text-sm bg-white text-indigo-700 font-bold px-4 py-1.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all">{t('nav.getStarted')}</Link>
              </>
            )}
          </div>
        </div>

        {/* ── Hero content ── */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {t('hero.badge')}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            {t('hero.headline1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-primary-300">
              {t('hero.headline2')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto">
            {t('hero.subline')}
          </p>

          {/* ── Big search bar with location picker ── */}
          <div className="max-w-2xl mx-auto mb-10">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl shadow-2xl overflow-visible">

                {/* Location picker */}
                <div className="relative flex-shrink-0" ref={locRef}>
                  <button
                    type="button"
                    onClick={() => setLocOpen((o) => !o)}
                    className="flex items-center gap-2 px-4 py-4 border-b sm:border-b-0 sm:border-r border-gray-200 hover:bg-gray-50 transition-colors rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl w-full sm:w-auto"
                    style={{ color: coords ? '#4f46e5' : '#6b7280' }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium max-w-[70px] sm:max-w-[110px] truncate">
                      {coords ? `${locationLabel} · ${radius} km` : t('hero.anywhere')}
                    </span>
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Location dropdown — NOT a nested form, uses div + onKeyDown */}
                  {locOpen && (
                    <div className="absolute top-full left-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 card shadow-2xl z-50 p-5 animate-fade-up text-gray-900">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('location.title')}</p>

                      {/* City input — plain div to avoid nested-form issue */}
                      <div className="flex gap-2 mb-3">
                        <input
                          value={locInput}
                          onChange={(e) => setLocInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocSubmit(e); } }}
                          placeholder={t('location.placeholder')}
                          className="input flex-1 text-gray-900"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleLocSubmit}
                          disabled={geoLoading}
                          className="btn-primary text-sm px-4 py-2 shrink-0"
                        >
                          {geoLoading
                            ? <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : t('location.go')
                          }
                        </button>
                      </div>

                      {/* Use my location */}
                      <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={geoLoading}
                        className="w-full flex items-center justify-center gap-2 text-sm py-2.5 px-3 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors mb-4"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('location.useMyLocation')}
                      </button>

                      {/* Radius — always visible */}
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">{t('location.searchWithin')}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {RADIUS_OPTIONS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRadius(r)}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                radius === r
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {r} km
                            </button>
                          ))}
                        </div>
                        {coords && (
                          <button
                            type="button"
                            onClick={() => { clearLocation(); setLocOpen(false); }}
                            className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-center"
                          >
                            {t('location.clearLocation')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Search input + suggestions */}
                <div className="relative flex-1" ref={searchRef}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowSuggestions(false)}
                    placeholder={t('hero.searchPlaceholder')}
                    className="w-full py-4 px-4 text-gray-800 text-base bg-transparent focus:outline-none"
                  />

                  {/* Suggestions dropdown */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-up">
                      {suggestionsLoading && suggestions.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400">…</div>
                      )}
                      {!suggestionsLoading && suggestionsSearched && suggestions.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400">No services found</div>
                      )}
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={() => {
                            setSearch(s.title);
                            setShowSuggestions(false);
                            navigate(`/services/${s.id}`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
                        >
                          <span className="text-xl shrink-0">{s.niche?.icon || '🛠️'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {t('niches.' + (s.niche?.slug || '').replace(/-/g, '_'), { defaultValue: s.niche?.name })}
                              {s.seller?.name && ` · ${s.seller.name}`}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-gray-500 shrink-0">
                            ${parseFloat(s.basePrice || s.base_price || 0).toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary shrink-0 m-1.5 rounded-xl sm:rounded-xl w-[calc(100%-0.75rem)] sm:w-auto">
                  {t('hero.search')}
                </button>
              </div>
            </form>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { key: 'gardening',   q: 'Gardening'   },
              { key: 'tutoring',    q: 'Tutoring'     },
              { key: 'cleaning',    q: 'Cleaning'     },
              { key: 'petCare',     q: 'Pet Care'     },
              { key: 'photography', q: 'Photography'  },
            ].map(({ key, q }) => (
              <button
                key={key}
                onClick={() => navigate(`/explore?q=${encodeURIComponent(q)}`)}
                className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-1.5 rounded-full transition-all hover:scale-105"
              >
                {t(`tags.${key}`)}
              </button>
            ))}
          </div>

          {/* Trust stats */}
          <div className="flex justify-center gap-6 sm:gap-8 mt-10 sm:mt-14">
            {TRUST_STAT_KEYS.map((s) => (
              <div key={s.key} className="text-center">
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{t(s.key)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 28C840 36 960 42 1080 40C1200 38 1320 28 1380 23L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#f8f8fc"/>
          </svg>
        </div>
      </section>

      {/* ── Browse by category ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-6 sm:mb-10">
          <p className="section-label">{t('categories.label')}</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{t('categories.heading')}</h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
          {niches.map((niche) => (
            <Link
              key={niche.id}
              to={`/explore?niche=${niche.slug}`}
              className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center text-center
                         border border-gray-100 shadow-sm
                         hover:shadow-xl hover:-translate-y-1 hover:border-primary-200
                         transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-50 to-violet-50 flex items-center justify-center mb-1.5 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl sm:text-3xl">{niche.icon || '🛠️'}</span>
              </div>
              <span className="font-bold text-[11px] sm:text-sm text-gray-900 leading-tight">{t('niches.' + niche.slug.replace(/-/g, '_'), { defaultValue: niche.name })}</span>
              <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{niche._count?.services || 0} {t('categories.services')}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured services ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-16">
        <div className="flex items-end justify-between mb-5 sm:mb-8">
          <div>
            <p className="section-label">{t('featured.label')}</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{t('featured.heading')}</h2>
          </div>
          <Link to="/explore" className="btn-secondary text-sm py-2">{t('featured.viewAll')}</Link>
        </div>

        {featured?.services?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {featured.services.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl bg-white border border-dashed border-gray-200">
            <div className="text-5xl mb-3">🛠️</div>
            <p className="text-gray-400 font-medium">{t('featured.empty')}</p>
            <p className="text-gray-300 text-sm mt-1">{t('featured.emptyHint')}</p>
          </div>
        )}
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label">{t('howItWorks.label')}</p>
            <h2 className="text-3xl font-black text-gray-900">{t('howItWorks.heading')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['🔍', '💬', '✅']).map((icon, i) => {
              const steps = t('howItWorks.steps', { returnObjects: true });
              const item = steps[i];
              return (
              <div key={item.step} className="card-hover p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md">
                    <span className="text-2xl">{icon}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary-400 tracking-widest">STEP {item.step}</span>
                    <h3 className="font-bold text-gray-900 mt-0.5">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Seller CTA ─────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-indigo-950 text-white p-6 sm:p-10 md:p-14 text-center">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <p className="section-label bg-white/10 border-white/20 text-white/80">{t('cta.label')}</p>
              <h2 className="text-3xl md:text-4xl font-black mb-3">{t('cta.heading')}</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">{t('cta.subline')}</p>
              <Link to={user ? '/dashboard/seller' : '/register'} className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all">
                {t('cta.button')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
