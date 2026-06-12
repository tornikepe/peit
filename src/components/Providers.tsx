'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/context/LanguageContext';
import AuthModalProvider from '@/components/auth/AuthModalProvider';
import { BotsProvider } from '@/context/BotsContext';
import { clerkAppearance } from '@/lib/clerk-appearance';
import CookieConsent from './CookieConsent';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      // Custom-built auth pages (headless Clerk flows) — no Clerk UI anywhere.
      signInUrl="/signin"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <LanguageProvider>
        <AuthModalProvider>
          <BotsProvider>
            {children}
            {/* Sits above all page content; reads language from LanguageProvider. */}
            <CookieConsent />
          </BotsProvider>
        </AuthModalProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}
