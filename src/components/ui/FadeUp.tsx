'use client';

// Lightweight scroll-reveal wrapper. Adds `.in-view` to itself once the
// node intersects the viewport, which trips the CSS fade-up transition
// in globals.css (`.fade-up.in-view → opacity 1, translateY 0`).
//
// Why not use the existing `.reveal` + ScrollReveal.tsx pattern? That
// runs one global observer across every `.reveal` node — fine for the
// homepage's 6-section flow, but expensive when we want fine-grained
// stagger control on a card grid. This component owns its own observer
// per instance so each card can pick its own `delay` prop.

import { useEffect, useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  /** Stagger offset in ms — useful for sibling cards. */
  delay?:   number;
  /** Visible % required to trigger; lower = fires earlier. */
  threshold?: number;
  className?: string;
  /** Render as a different element (default: div). */
  as?:      'div' | 'section' | 'article' | 'li';
}

export default function FadeUp({
  children, delay = 0, threshold = 0.15, className = '', as = 'div',
}: Props) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        // Stagger via a tiny delay inside the IO callback — keeps the
        // CSS rule itself stateless and avoids per-instance keyframes.
        if (delay > 0) window.setTimeout(() => setShown(true), delay);
        else setShown(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [delay, threshold]);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={`fade-up ${shown ? 'in-view' : ''} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
