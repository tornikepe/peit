import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Cookie პოლიტიკა — Peit',
  description: 'რომელ cookie-ს ვიყენებთ Peit-ის ვებსაიტზე და როგორ მართოთ ისინი.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return <LegalPage slug="cookies" />;
}
