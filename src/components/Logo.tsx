import Link from 'next/link';
import { Zap } from 'lucide-react';

// Single source of truth for the Peit brand mark — the violet→purple Zap
// tile + wordmark used in the dashboard sidebar. Reused across the marketing
// navbar, footer, and auth pages so the logo is identical everywhere.

interface LogoProps {
  /** Wrap in a Link to "/" (default true). Set false inside an existing link. */
  href?: string | null;
  /** Tile + text scale. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { box: 'w-7 h-7 rounded-lg',  icon: 'w-3.5 h-3.5', text: 'text-base' },
  md: { box: 'w-8 h-8 rounded-lg',  icon: 'w-4 h-4',     text: 'text-lg'  },
  lg: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5',    text: 'text-xl'  },
} as const;

export default function Logo({ href = '/', size = 'md', className = '' }: LogoProps) {
  const s = SIZES[size];
  const inner = (
    <>
      <div className={`${s.box} bg-gradient-to-br from-violet-500 to-purple-700 grid place-items-center shadow-lg shadow-violet-500/25`}>
        <Zap className={`${s.icon} text-white`} strokeWidth={2.5} />
      </div>
      <span className={`font-bold text-white ${s.text} tracking-tight`}>Peit</span>
    </>
  );

  if (href === null) {
    return <span className={`flex items-center gap-2 ${className}`}>{inner}</span>;
  }
  return (
    <Link href={href} aria-label="Peit" className={`flex items-center gap-2 transition-transform hover:-translate-y-px ${className}`}>
      {inner}
    </Link>
  );
}
