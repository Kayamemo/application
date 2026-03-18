// Persists the user's chosen location (coords + label + radius) in localStorage
// so it's shared between Navbar search and Explore page.
import { useState, useEffect } from 'react';

const KEY = 'kaya_geo_filter';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}

export function useGeoFilter() {
  const [state, setState] = useState(load);

  const save = (next) => {
    setState(next);
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  };

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === KEY) setState(load());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return {
    coords:        state ? { lat: state.lat, lng: state.lng } : null,
    locationLabel: state?.label ?? '',
    radius:        state?.radius ?? '25',
    setLocation:   ({ lat, lng, label, radius = '25' }) => save({ lat, lng, label, radius }),
    setRadius:     (radius) => state && save({ ...state, radius }),
    clearLocation: () => save(null),
  };
}
