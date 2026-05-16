import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'კონფიდენციალურობის პოლიტიკა — Peit',
  description: 'როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს მონაცემებს — Peit-ის სრული privacy policy.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
