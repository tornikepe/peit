// Bare layout for the embedded widget — no nav, no providers.
// Allows cross-origin embedding via the X-Frame-Options / CSP set in middleware.

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '@/app/globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Peit Chat',
  robots: { index: false, follow: false },
};

export default function WidgetLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ka" className={geist.variable}>
      <body
        className="font-sans antialiased"
        style={{ background: 'transparent', margin: 0, padding: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
