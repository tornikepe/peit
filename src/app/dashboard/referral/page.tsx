import PageHeader from '@/components/dashboard-shell/PageHeader';
import ReferralView from '@/components/dashboard/ReferralView';

export const metadata = { title: 'მოწვევა — Peit' };

export default function ReferralPage() {
  return (
    <>
      <PageHeader
        eyebrow="REFERRAL"
        title="მოწვევის პროგრამა"
        subtitle="მოიწვიე მეგობრები და ბიზნესები — ორივე იღებთ ჯილდოს."
      />
      <ReferralView />
    </>
  );
}
