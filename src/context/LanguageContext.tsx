'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Lang, type Translations, translations } from '@/lib/i18n';

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ka',
  setLang: () => {},
  t: translations.ka,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ka');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('peit-lang') as Lang | null;
      if (saved && (saved === 'ka' || saved === 'en' || saved === 'ru')) {
        // Hydrating client-only state from localStorage is exactly the
        // case React docs call out as legitimate setState-in-effect:
        // we can't read localStorage during SSR, so this MUST happen post-mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(saved);
      }
    } catch {
      // localStorage not available (SSR or privacy-mode browser).
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('peit-lang', l);
    } catch {
      // ignore
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
