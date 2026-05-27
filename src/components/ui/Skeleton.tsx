// Pulse-animated skeleton primitive + shape variants for the surfaces
// we actually wait on in production. Tailwind's `animate-pulse` matches
// the rest of the design system, so skeletons here read like a faded
// version of the real card.

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-white/[0.06] border border-white/[0.04]',
        className,
      )}
    />
  );
}

// ─── Blog card — matches `glass rounded-2xl` cards in /blog index. ────
// Three of these render in `app/blog/loading.tsx` so the grid never
// flashes from empty to filled.
export function BlogCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[70%]" />
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

// ─── Pricing card — matches the highlighted + standard plan widths. ──
export function PricingCardSkeleton({ highlight }: { highlight?: boolean } = {}) {
  return (
    <div
      className={cn(
        'rounded-3xl p-8 flex flex-col gap-7 relative border border-white/[0.06] bg-white/[0.02]',
        highlight && 'md:scale-[1.04]',
      )}
    >
      <Skeleton className="h-3 w-16" />
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-4 w-[80%]" />
      <div className="space-y-3 flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-[85%]" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

// ─── Chat-widget placeholder — shown while the lazy chunk is loading. ─
// Bottom-right corner, same 60×60 launcher size as the real bubble.
export function ChatWidgetSkeleton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <Skeleton className="w-[60px] h-[60px] rounded-full" />
    </div>
  );
}
