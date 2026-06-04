// Shared Clerk appearance — brand colour + primary button only.
//
// NOTE: Clerk's own CSS-in-JS wins specificity over hand-rolled element
// classes, and the `dark` baseTheme proved unreliable with this Clerk
// version. The actual dark/readable theming is enforced with global
// `.cl-*` overrides in src/app/globals.css (search "Clerk dark theme").
// Here we only set the brand accent (links / focus rings) and the primary
// CTA gradient, which Clerk does honour via the appearance prop.

export const clerkAppearance = {
  variables: {
    colorPrimary: '#3b82f6',
    borderRadius: '0.7rem',
    fontFamily:   'var(--font-geist-sans), system-ui, sans-serif',
  },
  elements: {
    formButtonPrimary:
      'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25 normal-case',
    // Hide Clerk's "Secured by Clerk" footer so the auth cards and the
    // account menu read as first-party. (The orange "Development mode"
    // badge is intrinsic to dev keys and fully disappears with production
    // Clerk keys.)
    footer: 'hidden',
  },
};
