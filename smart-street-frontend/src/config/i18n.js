import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import ta from '../locales/ta.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta'],
    load: 'languageOnly',   // Strip region codes: 'en-US' -> 'en'
    interpolation: {
      escapeValue: false
    },
    detection: {
      // Check localStorage first, then URL query, then browser
      order: ['localStorage', 'querystring', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',  // The exact key we write in LanguageSwitcher
      lookupQuerystring: 'lng'
    }
  });

export default i18n;

