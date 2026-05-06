'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/context/LanguageContext';
import { BotsProvider } from '@/context/BotsContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <LanguageProvider>
        <BotsProvider>
          {children}
        </BotsProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}
