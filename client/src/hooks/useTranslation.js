import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import translations from '../services/translations';

export const useTranslation = () => {
  const { user } = useAuth();
  
  // Local language state for unauthenticated pages (default to 'ja' if none set)
  const [localLang, setLocalLangState] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });

  // Keep local storage in sync and trigger state changes
  const setLanguage = (lang) => {
    localStorage.setItem('preferredLanguage', lang);
    setLocalLangState(lang);
  };

  // Determine current active language: user setting takes priority, else localLang
  const currentLang = user?.preferredLanguage || localLang;

  // Translation helper function
  const t = (key, params = {}) => {
    const dict = translations[currentLang] || translations['en'];
    
    // Support nested keys (e.g., 'sidebar.dashboard')
    const keys = key.split('.');
    let value = dict;
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
    
    if (value === null) {
      return key;
    }

    // Replace parameter placeholders (e.g. {count} or {score})
    let text = String(value);
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
    });

    return text;
  };

  return { t, currentLang, setLanguage };
};
