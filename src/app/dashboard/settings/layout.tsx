// /dashboard/settings/* — nests inside the parent dashboard layout
// (which already provides sidebar + topbar + auth gate). This layout
// only adds the SettingsNav sub-rail beside the page content.

import type { Metadata } from 'next';
import PageHeader from '@/components/dashboard-shell/PageHeader';
import SettingsNav from '@/components/settings/SettingsNav';
import T from '@/components/T';

export const metadata: Metadata = {
  title: 'პარამეტრები — Peit',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title={<T ka="პარამეტრები" en="Settings" />}
        subtitle={<T ka="ანგარიში, გადახდები, გუნდი, API გასაღებები და ნოტიფიკაციები" en="Account, billing, team, API keys and notifications" />}
      />
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-8">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
