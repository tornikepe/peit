'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/context/LanguageContext';
import { BotsProvider } from '@/context/BotsContext';
import CookieConsent from './CookieConsent';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <LanguageProvider>
        <BotsProvider>
          {children}
          {/* Sits above all page content; reads language from LanguageProvider. */}
          <CookieConsent />
        </BotsProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}
