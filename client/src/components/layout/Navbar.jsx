// ============================================================
// Navbar — Responsive navigation with auth state + location picker
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';
import { useGeoFilter } from '../../hooks/useGeoFilter';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

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

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { coords, locationLabel, radius, setLocation, setRadius, clearLocation } = useGeoFilter();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [locOpen,    setLocOpen]    = useState(false);
  const [locInput,   setLocInput]   = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const menuRef  = useRef(null);
  const locRef   = useRef(null);

  // Load notifications
  useEffect(() => {
    if (!user) return;
    usersAPI.getNotifications().then(({ data }) => {
      setNotifications(data.slice(0, 5));
      setUnread(data.filter((n) => !n.readAt).length);
    }).catch(() => {});
  }, [user]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
      if (locRef.current && !locRef.current.contains(e.target)) {
        setLocOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync input with stored label when dropdown opens
  useEffect(() => {
    if (locOpen) setLocInput(locationLabel);
  }, [locOpen, locationLabel]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNotifOpen = async () => {
    setNotifOpen((o) => !o);
    if (unread > 0) {
      await usersAPI.markNotificationsRead();
      setUnread(0);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.elements.q.value.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (coords) {
      params.set('lat', coords.lat);
      params.set('lng', coords.lng);
      params.set('radius', radius);
    }
    navigate(`/explore?${params.toString()}`);
  };

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
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
      () => {
        toast.error('Could not get your location');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }, [radius, setLocation]);

  const handleLocSearch = async (e) => {
    e.preventDefault();
    if (!locInput.trim()) { clearLocation(); setLocOpen(false); return; }
    setGeoLoading(true);
    try {
      const result = await forwardGeocode(locInput.trim());
      setLocation({ lat: result.lat, lng: result.lng, label: result.label, radius });
      setLocInput(result.label);
      setLocOpen(false);
    } catch {
      toast.error('Location not found');
    } finally {
      setGeoLoading(false);
    }
  };

  return (
    <nav className="glass border-b border-white/30 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="text-xl font-black tracking-tight gradient-text">Kaya</span>
          </Link>

          {/* ── Search + Location bar ── */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="w-full flex items-center bg-gray-100 rounded-xl focus-within:ring-2 transition-all"
                 style={{ '--tw-ring-color': '#818cf8' }}>

              {/* Location picker trigger */}
              <div className="relative flex-shrink-0 rounded-l-xl overflow-hidden" ref={locRef}>
                <button
                  type="button"
                  onClick={() => setLocOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-r border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                  style={{ color: coords ? '#4f46e5' : '#6b7280' }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="max-w-[100px] truncate">
                    {coords ? locationLabel : 'Anywhere'}
                  </span>
                  <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Location dropdown */}
                {locOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 card shadow-xl z-50 p-4 animate-fade-up">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Choose location</p>

                    {/* City input */}
                    <form onSubmit={handleLocSearch} className="flex gap-2 mb-3">
                      <input
                        value={locInput}
                        onChange={(e) => setLocInput(e.target.value)}
                        placeholder="City or neighbourhood…"
                        className="input text-sm flex-1"
                        autoFocus
                      />
                      <button type="submit" disabled={geoLoading} className="btn-primary text-sm px-3 py-2 shrink-0">
                        {geoLoading
                          ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : 'Go'
                        }
                      </button>
                    </form>

                    {/* Use my location */}
                    <button
                      onClick={useMyLocation}
                      disabled={geoLoading}
                      className="w-full flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors mb-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Use my current location
                    </button>

                    {/* Radius */}
                    {coords && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Search radius</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {RADIUS_OPTIONS.map((r) => (
                            <button
                              key={r}
                              onClick={() => setRadius(r)}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                radius === r
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {r} km
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clear */}
                    {coords && (
                      <button
                        onClick={() => { clearLocation(); setLocOpen(false); }}
                        className="mt-3 w-full text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ✕ Clear location
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Search input */}
              <form className="flex items-center flex-1 px-3 gap-2 rounded-r-xl overflow-hidden" onSubmit={handleSearch}>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  name="q"
                  placeholder="What do you need help with?"
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none py-2"
                />
              </form>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2" ref={menuRef}>
            {user ? (
              <>
                <Link to="/messages" className="btn-ghost hidden sm:flex items-center gap-1.5 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Messages</span>
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={handleNotifOpen}
                    className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 card shadow-xl z-50 overflow-hidden animate-fade-up">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unread > 0 && <span className="text-xs font-medium" style={{ color: '#4f46e5' }}>{unread} new</span>}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="text-3xl mb-2">🔔</div>
                          <p className="text-sm text-gray-400">All caught up!</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                          {notifications.map((n) => (
                            <li key={n.id} className={`hover:bg-gray-50 transition-colors ${!n.readAt ? 'bg-indigo-50/50' : ''}`}>
                              {n.link ? (
                                <Link to={n.link} className="block px-4 py-3" onClick={() => setNotifOpen(false)}>
                                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                                </Link>
                              ) : (
                                <div className="px-4 py-3">
                                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 card shadow-xl z-50 py-1 overflow-hidden animate-fade-up">
                      <div className="px-4 py-3 border-b border-gray-100" style={{ background: 'linear-gradient(to right, #eef2ff, #f5f3ff)' }}>
                        <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs font-medium capitalize" style={{ color: '#4f46e5' }}>{user.role.toLowerCase()}</p>
                      </div>
                      {[
                        { to: '/dashboard',        label: 'My Orders',        icon: '📦' },
                        ...(user.role === 'SELLER' || user.role === 'ADMIN' ? [{ to: '/dashboard/seller', label: 'Seller Dashboard', icon: '🛠️' }] : []),
                        ...(user.role === 'ADMIN'  ? [{ to: '/admin',          label: 'Admin Panel',       icon: '⚙️' }] : []),
                      ].map((item) => (
                        <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <span>{item.icon}</span>{item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm">Log in</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
