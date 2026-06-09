import type { CSSProperties } from 'react';

// Shared inline-SVG icon set for the marketing surfaces (.ms-root). Extracted
// so the nav/footer can be reused on the legal pages without importing the
// whole landing.

export const ICONS: Record<string, string> = {
  clock: 'M12 7v5l3 2 M12 21a9 9 0 100-18 9 9 0 000 18z',
  channels: 'M4 6h16 M4 12h10 M4 18h7 M18 14l3 3-3 3',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c2.5 2.5 2.5 15.5 0 18 M12 3c-2.5 2.5-2.5 15.5 0 18',
  lead: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M19 8v6 M22 11h-6',
  chart: 'M4 19V5 M4 19h16 M8 16l3-4 3 2 4-6',
  plug: 'M9 7V3 M15 7V3 M7 7h10v4a5 5 0 01-10 0V7z M12 16v5',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  arrowUpRight: 'M7 17L17 7 M8 7h9v9',
  check: 'M5 12l5 5L20 7',
  star: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z',
  spark: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M18 6l-2.5 2.5 M8.5 15.5L6 18',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  x: 'M6 6l12 12 M18 6L6 18',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v3 M12 20v3 M4 12H1 M23 12h-3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2',
  moon: 'M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z',
  tg: 'M22 4L2 11l6 2 2 7 3-4 5 4 4-16z M8 13l9-6',
  ig: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4z M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z M17 6.5h.01',
  web: 'M3 9h18 M9 21V9 M12 3a9 9 0 100 18 9 9 0 000-18z',
};

export function Icon({ name, size = 22, sw = 1.6, style }: { name: string; size?: number; sw?: number; style?: CSSProperties }) {
  const d = ICONS[name] || ICONS.spark;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {d.split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>
  );
}
