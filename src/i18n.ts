import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traduções (começamos com PT, EN e FR vazios)
import translationPT from './locales/pt/translation.json';
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';

// Configuração dos recursos de tradução
const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

i18n
  // Detetar idioma do navegador
  .use(LanguageDetector)
  // Passar a instância i18n para react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    resources, // Recursos de tradução
    fallbackLng: 'pt', // Idioma de fallback se o detetado não estiver disponível
    debug: process.env.NODE_ENV === 'development', // Ativar logs no modo de desenvolvimento
    supportedLngs: ['pt', 'en', 'fr'], // Idiomas suportados

    interpolation: {
      escapeValue: false, // React já faz escaping por defeito
    },

    detection: {
      // Ordem e de onde detetar o idioma
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      // Chave a usar no localStorage
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    }
  });

export default i18n; 