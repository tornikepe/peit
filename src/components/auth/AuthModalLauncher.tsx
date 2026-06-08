'use client';

// Opens the Clerk sign-in / sign-up MODAL on the homepage based on query
// flags, so we don't need standalone /signin /signup pages:
//   /?signin=1        → open sign-in modal
//   /?signup=1        → open sign-up modal
//   /?ref=<code>      → open sign-up modal (a shared referral link)
// After auth, Clerk redirects to /dashboard. The flag is stripped from the URL
// so a refresh doesn't re-open the modal.

import { useEffect, useRef } from 'react';
import { useClerk, useAuth } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthModalLauncher() {
  const { openSignIn, openSignUp } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (!isLoaded || fired.current) return;

    const wantSignin = params.get('signin') != null;
    const wantSignup = params.get('signup') != null || params.get('ref') != null;
    if (!wantSignin && !wantSignup) return;

    fired.current = true;

    // Already signed in → just go to the dashboard.
    if (isSignedIn) { router.replace('/dashboard'); return; }

    if (wantSignup) openSignUp({ forceRedirectUrl: '/dashboard' });
    else            openSignIn({ forceRedirectUrl: '/dashboard' });

    // Strip the flag from the URL (keep ?ref so the cookie path still reads it
    // on a hard refresh, but drop the modal trigger).
    const sp = new URLSearchParams(params.toString());
    sp.delete('signin'); sp.delete('signup');
    const qs = sp.toString();
    router.replace(qs ? `/?${qs}` : '/');
  }, [isLoaded, isSignedIn, params, openSignIn, openSignUp, router]);

  return null;
}
