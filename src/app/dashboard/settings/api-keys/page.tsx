import type { Metadata } from 'next';
import ApiKeysPanel from '@/components/settings/ApiKeysPanel';

export const metadata: Metadata = { title: 'API გასაღებები — Peit' };

export default function ApiKeysSettingsPage() {
  return <ApiKeysPanel />;
}
