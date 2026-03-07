import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('yusi-language') || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const changeLanguage = (lng: 'zh' | 'en') => {
  i18n.changeLanguage(lng);
  localStorage.setItem('yusi-language', lng);
};

export const getCurrentLanguage = () => i18n.language as 'zh' | 'en';
