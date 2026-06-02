// GET /og?title=…&description=…&type=…
//
// Dynamic OpenGraph card generator. @vercel/og runs in the edge runtime
// and renders JSX → a 1200×630 PNG that social platforms scrape for
// previews. We don't need a separate Twitter image — `summary_large_image`
// reuses the OG one.
//
// Title is rendered with the brand wordmark + gradient accent, then the
// truncated description below. Type ("website" | "article") only
// affects the small badge at the top so the card subtly tells readers
// whether they're looking at a marketing page or a blog post.
//
// Note: @vercel/og is system-font only by default. We rely on its
// built-in Inter for Latin / Cyrillic glyphs; the Noto Sans Georgian
// face would need a custom font fetch which adds ~200ms cold-start
// latency. The Georgian chars still render legibly via the platform's
// fallback chain, just less crisp than in the rest of the product.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const BG    = '#0a0a0a';
const FG    = '#f5f3ee';
const DIM   = '#9ca3af';
const BRAND = '#2563eb';
const BRAND_LIGHT = '#93c5fd';

export async function GET(req: Request) {
  const url   = new URL(req.url);
  const title       = (url.searchParams.get('title')       || 'Peit').slice(0, 120);
  const description = (url.searchParams.get('description') || 'AI ჩატბოტი ქართული ბიზნესისთვის').slice(0, 220);
  const type        = (url.searchParams.get('type')        || 'website') === 'article' ? 'article' : 'website';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: BG, color: FG,
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {/* Layered ambient gradients — same brand language as the live
            site so the OG card feels native when shared. */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            `radial-gradient(60% 60% at 10% 0%, ${BRAND}55 0%, transparent 60%),` +
            `radial-gradient(50% 50% at 100% 100%, #38bdf844 0%, transparent 60%)`,
        }} />
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        {/* Top row: brand wordmark + content-type badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `linear-gradient(135deg, ${BRAND_LIGHT}, ${BRAND})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 12px 30px ${BRAND}55`,
              fontSize: 28, fontWeight: 800, color: '#fff',
            }}>P</div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em' }}>
              Peit
            </div>
          </div>

          <div style={{
            padding: '8px 18px', borderRadius: 999,
            background: `${BRAND}26`,
            border: `1px solid ${BRAND}55`,
            color: BRAND_LIGHT,
            fontSize: 18, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
            {type === 'article' ? 'სტატია' : 'Peit'}
          </div>
        </div>

        {/* Title — capped at ~3 lines via maxHeight + overflow */}
        <div style={{
          display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', marginTop: 24,
        }}>
          <div style={{
            fontSize: title.length > 80 ? 60 : 72,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            color: FG,
            maxWidth: 1060,
            display: 'flex',
          }}>
            {title}
          </div>

          {description && (
            <div style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.45,
              color: DIM,
              maxWidth: 980,
              display: 'flex',
            }}>
              {description}
            </div>
          )}
        </div>

        {/* Bottom: URL + accent bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 24, paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 22, color: DIM, fontWeight: 500 }}>
            peit.vercel.app
          </div>
          <div style={{
            height: 6, width: 220, borderRadius: 999,
            background: `linear-gradient(90deg, ${BRAND}, #38bdf8, ${BRAND})`,
          }} />
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    },
  );
}
