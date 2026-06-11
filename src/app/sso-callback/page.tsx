'use client';

// OAuth landing pad for the custom auth pages' "Continue with Google" flow.
// AuthenticateWithRedirectCallback is headless — it just completes the
// handshake and forwards to /dashboard; the user only sees our spinner.

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function SsoCallbackPage() {
  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
