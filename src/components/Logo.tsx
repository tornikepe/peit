import Link from 'next/link';

// Single source of truth for the Peit brand mark — the text wordmark
// "pe·i·t" with a gradient accent on the "i". Reused across the marketing
// navbar/footer, the auth pages, and the dashboard so the logo is identical
// everywhere.

interface LogoProps {
  /** Wrap in a Link to "/" (default true). Set false inside an existing link. */
  href?: string | null;
  /** Wordmark scale. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
} as const;

export default function Logo({ href = '/', size = 'md', className = '' }: LogoProps) {
  const text = (
    <span className={`font-extrabold text-white ${SIZES[size]} tracking-[-0.04em] leading-none`}>
      pe<span className="gradient-text">i</span>t
    </span>
  );

  if (href === null) {
    return <span className={`inline-flex items-center ${className}`}>{text}</span>;
  }
  return (
    <Link
      href={href}
      aria-label="Peit"
      className={`inline-flex items-center cursor-pointer transition-transform hover:-translate-y-px ${className}`}
    >
      {text}
    </Link>
  );
}
