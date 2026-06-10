'use client';

// Tiny bilingual text node — renders the ka or en string based on the shared
// LanguageContext. Lets SERVER components (dashboard pages) emit localized
// text without converting to client components: they pass both translations
// and only this leaf re-renders on language change.

import { useLanguage } from '@/context/LanguageContext';

export default function T({ ka, en }: { ka: string; en: string }) {
  const { lang } = useLanguage();
  return <>{lang === 'en' ? en : ka}</>;
}
