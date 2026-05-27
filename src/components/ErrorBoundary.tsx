'use client';

// Reusable React error boundary for client-component subtrees where a
// rogue render shouldn't take down the whole route — chat widget,
// dashboard tabs, anything that owns its own fetch / state.
//
// Why a class component? React still doesn't offer a hook-based
// equivalent for getDerivedStateFromError / componentDidCatch — they
// only fire on class components.
//
// Errors are forwarded to Sentry (when configured) so we get a stack
// trace even if the user never reports the bug.

import * as React from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: React.ReactNode;
  /** Render-prop fallback. Defaults to a simple inline error pill. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Tag for Sentry breadcrumbs so we can tell which subtree blew up. */
  scope?: string;
}

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Console for local dev visibility; Sentry for production.
    console.error('[ErrorBoundary]', this.props.scope ?? '', error, info);
    Sentry.captureException(error, {
      tags: { component: this.props.scope ?? 'unknown' },
      contexts: {
        react: { componentStack: info.componentStack ?? undefined },
      },
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <span>კომპონენტი ვერ ჩაიტვირთა</span>
          <button
            type="button"
            onClick={this.reset}
            className="underline hover:text-red-100"
          >
            ხელახლა
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
