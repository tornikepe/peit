// Fixed top banner shown only on the staging environment so testers never
// confuse it with production. Driven by NEXT_PUBLIC_ENV=staging (inlined at
// build time). Renders nothing in development/production.

export default function StagingBanner() {
  if (process.env.NEXT_PUBLIC_ENV !== 'staging') return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-black text-center text-xs py-1 font-mono">
      STAGING — not production data
    </div>
  );
}
