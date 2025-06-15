
import { useAuth } from './useAuth';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const translations: { [key: string]: { [key: string]: string } } = {
  en,
  hi,
};

export const useTranslation = () => {
  const { language } = useAuth();
  const lang = translations[language] ? language : 'en';

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return { t, language };
};
