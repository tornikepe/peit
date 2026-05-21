// Reusable page header — title + optional eyebrow + subtitle + action
// slot. Sits at the top of every page's content area below the global
// topbar. Stays a Server Component (no client-only deps) so it composes
// cheaply.

import type { ReactNode } from 'react';

interface Props {
  /** Small uppercase label above the title — e.g. "DASHBOARD" or breadcrumb. */
  eyebrow?: ReactNode;
  title:    ReactNode;
  /** One-line description under the title. */
  subtitle?: ReactNode;
  /** Right-aligned slot for primary action buttons. */
  action?:   ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, action }: Props) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-medium mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap shrink-0">{action}</div>}
    </header>
  );
}
