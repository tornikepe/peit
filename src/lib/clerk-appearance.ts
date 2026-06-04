// Shared Clerk appearance — Clerk's built-in `dark` baseTheme (correct,
// readable dark contrast everywhere) layered with the Peit brand blue.
// Applied globally on ClerkProvider so the UserButton popover, the
// "Manage account" (UserProfile) modal, and the sign-in / sign-up cards all
// match the Midnight Signal dashboard.
//
// We rely on `baseTheme: dark` for text/background contrast (hand-rolled
// Tailwind overrides don't win specificity inside Clerk's own styles), and
// only override the accent colour + primary button to stay on-brand.

import { dark } from '@clerk/themes';

export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary:    '#3b82f6', // brand blue (blue-500) — used for links, focus, accents
    colorBackground: '#0c0c16', // card / popover / modal surface
    borderRadius:    '0.7rem',
    fontFamily:      'var(--font-geist-sans), system-ui, sans-serif',
  },
  elements: {
    // Keep the primary CTA on the dashboard's blue gradient.
    formButtonPrimary:
      'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25 normal-case',
  },
};
