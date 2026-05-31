import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mr from './locales/mr';
import en from './locales/en';

// Read saved language from localStorage; default to Marathi
function getSavedLanguage(): string {
  try {
    const stored = JSON.parse(localStorage.getItem('sms_app_state') || '{}');
    return stored.language || 'mr';
  } catch {
    return 'mr';
  }
}

i18n.use(initReactI18next).init({
  resources: {
    mr: { translation: mr },
    en: { translation: en },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'mr',
  interpolation: {
    escapeValue: false,
  },
  pluralSeparator: '_',
});

export default i18n;
