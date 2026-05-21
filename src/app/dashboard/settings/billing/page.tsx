import type { Metadata } from 'next';
import BillingView from '@/components/settings/BillingView';

export const metadata: Metadata = { title: 'გადახდები — Peit' };

export default function BillingSettingsPage() {
  return <BillingView />;
}
