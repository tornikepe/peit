import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'სერვისის წესები — Peit',
  description: 'Peit-ის სერვისის წესები და პირობები — გადახდა, ტრიალი, გაუქმება, დაშვებული გამოყენება, პასუხისმგებლობა.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
