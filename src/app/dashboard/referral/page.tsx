import PageHeader from '@/components/dashboard-shell/PageHeader';
import ReferralView from '@/components/dashboard/ReferralView';
import T from '@/components/T';

export const metadata = { title: 'მოწვევა — Peit' };

export default function ReferralPage() {
  return (
    <>
      <PageHeader
        eyebrow="REFERRAL"
        title={<T ka="მოწვევის პროგრამა" en="Referral program" />}
        subtitle={<T ka="მოიწვიე მეგობრები და ბიზნესები — ორივე იღებთ ჯილდოს." en="Invite friends and businesses — you both get rewarded." />}
      />
      <ReferralView />
    </>
  );
}
