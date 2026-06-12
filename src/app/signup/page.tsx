// Auth lives in a modal on the homepage — this stub keeps /signup working
// (referral links ?ref, pricing ?plan, SEO CTAs) by bouncing to "/" with the
// sign-up flag and any preserved params.
import { redirect } from 'next/navigation';

export default async function SignUpRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  usp.set('signup', '1');
  if (typeof sp.plan === 'string') usp.set('plan', sp.plan);
  if (typeof sp.ref === 'string')  usp.set('ref', sp.ref);
  redirect(`/?${usp.toString()}`);
}
