import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import de from './de';
import es from './es';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      es: { translation: es },
    },
    lng: localStorage.getItem('kaya_lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Persist language changes
i18n.on('languageChanged', (lng) => localStorage.setItem('kaya_lang', lng));

export default i18n;
