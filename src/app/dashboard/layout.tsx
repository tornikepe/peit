// Shared chrome for every /dashboard/* page.
//
// Auth gate runs once here so we don't re-fetch the Clerk session in
// every nested layout / page. Children are rendered inside <Shell/>
// which provides the sidebar + topbar + max-width content frame.

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Shell from '@/components/dashboard-shell/Shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  return <Shell>{children}</Shell>;
}
