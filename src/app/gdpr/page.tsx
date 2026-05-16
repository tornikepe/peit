import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'GDPR DPA — Peit',
  description: 'Peit-ის Data Processing Agreement — GDPR-ის შესაბამისი ხელშეკრულება ბიზნეს მომხმარებლებისთვის.',
  alternates: { canonical: '/gdpr' },
};

export default function GdprPage() {
  return <LegalPage slug="gdpr" />;
}
