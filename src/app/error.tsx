'use client';

// Per-route error boundary — catches runtime errors raised inside a
// page (server components, client components, server actions). Next.js
// auto-resets on navigation, so the user can recover by clicking
// "Retry" or moving to another page.
//
// global-error.tsx handles errors from the root layout itself (rare —
// only fires when this very file fails).

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Forward to Sentry on mount; harmless when the DSN isn't set.
  useEffect(() => {
    console.error('[app/error]', error);
    Sentry.captureException(error, {
      tags: { boundary: 'app-error' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          სერვერის შეცდომა
        </h1>
        <p className="text-gray-400 text-sm mb-1">
          გთხოვთ სცადოთ თავიდან.
        </p>
        <p className="text-gray-500 text-xs mb-8">
          Something went wrong on our side. Please try again.
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-gray-600 mb-6">
            ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" /> სცადე თავიდან
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.06] px-4 py-2 rounded-lg"
          >
            <Home className="w-3.5 h-3.5" /> მთავარი
          </Link>
        </div>
      </div>
    </div>
  );
}
