'use client';

// Last-resort error boundary — fires only when the ROOT layout itself
// throws (font loading, providers crash, etc). Must include its own
// <html> + <body> because the global layout is what failed.
//
// Sentry.captureException ships the stack trace before the page
// renders so even pre-paint crashes are observable.

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags:  { boundary: 'global-error' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="ka">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07070f',
          color: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            მოხდა შეცდომა
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 4 }}>
            გვერდი ვერ ჩაიტვირთა. გთხოვთ განაახლოთ.
          </p>
          <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 24 }}>
            Something broke loading the page. Please refresh.
          </p>
          {error.digest && (
            <p style={{ color: '#4b5563', fontSize: 10, fontFamily: 'monospace', marginBottom: 24 }}>
              ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            განახლება / Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
