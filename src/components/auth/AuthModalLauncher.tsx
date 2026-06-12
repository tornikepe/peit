'use client';

// Opens the custom auth modal from URL flags, so /signin /signup redirects and
// old links (?signin=1 / ?signup=1 / referral ?ref=...) land on the homepage
// with the right modal open. Strips the flag, keeps ?plan/?ref in the URL.

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthModal } from './AuthModalProvider';

export default function AuthModalLauncher() {
  const { isSignedIn, isLoaded } = useAuth();
  const { open } = useAuthModal();
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const wantSignin = params.get('signin') != null;
    const wantSignup = params.get('signup') != null || params.get('ref') != null;
    if (!wantSignin && !wantSignup) return;

    if (isSignedIn) { router.replace('/dashboard'); return; }

    open(wantSignup ? 'signup' : 'signin');

    // Strip the modal flag; keep ?plan (checkout resume) and ?ref (referral
    // cookie on hard refresh) in the URL.
    const sp = new URLSearchParams(params.toString());
    sp.delete('signin'); sp.delete('signup');
    const qs = sp.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [isLoaded, isSignedIn, params, open, router]);

  return null;
}
