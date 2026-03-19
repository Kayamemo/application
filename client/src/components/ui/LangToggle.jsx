import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
];

// variant: 'light' (dark hero bg) | 'dark' (white bg) | 'inline' (row of buttons inside a dropdown)
export default function LangToggle({ variant = 'dark' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  // Inline variant — renders a row of flag+code buttons, no dropdown wrapper needed
  if (variant === 'inline') {
    return (
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Language</p>
        <div className="flex gap-1 flex-wrap">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => i18n.changeLanguage(l.code)}
              className={`flex-1 min-w-[52px] py-1.5 rounded-lg text-xs font-bold transition-all ${
                i18n.language === l.code ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const btnLight = 'border-white/30 text-white/80 hover:bg-white/15 hover:text-white';
  const btnDark  = 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change language"
        className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-xl border transition-all ${variant === 'light' ? btnLight : btnDark}`}
      >
        {/* Globe icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="uppercase tracking-wide text-xs font-bold">{current.code}</span>
        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 card shadow-xl z-[999] py-1 overflow-hidden animate-fade-up">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Language</p>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                i18n.language === lang.code
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {i18n.language === lang.code && (
                <svg className="w-3.5 h-3.5 ml-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
