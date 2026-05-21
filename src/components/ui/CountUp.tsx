'use client';

// Animated number counter — fires once when the element scrolls into
// view. Uses IntersectionObserver instead of a scroll handler so the
// browser only does layout math when the node is actually visible.
//
// Format is intentionally simple — pass `value` as the target number,
// `suffix` for the unit ("%", "x", "+"). For currency-style "₾2.1M"
// numbers, pass the static string as `prefix`/`suffix` and let `value`
// be just the digit part.

import { useEffect, useRef, useState } from 'react';

interface Props {
  value:     number;
  duration?: number;   // ms
  prefix?:   string;
  suffix?:   string;
  /** When the value isn't an integer (3.2x), how many decimals to render. */
  decimals?: number;
  className?: string;
}

export default function CountUp({
  value, duration = 1400, prefix = '', suffix = '', decimals = 0, className,
}: Props) {
  const [display, setDisplay] = useState(0);
  const ref       = useRef<HTMLSpanElement | null>(null);
  const firedRef  = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting || firedRef.current) continue;
        firedRef.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic — fast start, gentle finish reads as "settling".
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(value * eased);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString('en-US');

  return (
    <span ref={ref} className={className ? `${className} tabular` : 'tabular'}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
