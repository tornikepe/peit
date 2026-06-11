'use client';

// Legacy-link shim. Auth now lives on the custom /signin and /signup pages;
// old URLs with ?signin=1 / ?signup=1 (emails, bookmarks, referral links with
// ?ref=...) forward there. Keeps ?ref/?plan so the referral cookie and the
// checkout-resume flow still work.

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthModalLauncher() {
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

    if (isSignedIn) { router.replace('/dashboard'); return; }

    const sp = new URLSearchParams();
    const plan = params.get('plan');
    const ref  = params.get('ref');
    if (plan) sp.set('plan', plan);
    if (ref)  sp.set('ref', ref);
    const qs = sp.toString();
    router.replace(`${wantSignup ? '/signup' : '/signin'}${qs ? `?${qs}` : ''}`);
  }, [isLoaded, isSignedIn, params, router]);

  return null;
}
