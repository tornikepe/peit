'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/context/LanguageContext';
import { BotsProvider } from '@/context/BotsContext';
import { clerkAppearance } from '@/lib/clerk-appearance';
import CookieConsent from './CookieConsent';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      // No standalone auth pages — sign-in/up happen in a modal on the home
      // page. Point Clerk at "/" so a protected-route redirect (and the modal's
      // internal links) land on the homepage instead of a deleted /signin page.
      signInUrl="/?signin=1"
      signUpUrl="/?signup=1"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
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
