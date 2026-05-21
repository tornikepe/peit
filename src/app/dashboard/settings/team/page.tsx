import type { Metadata } from 'next';
import TeamPanel from '@/components/settings/TeamPanel';

export const metadata: Metadata = { title: 'გუნდი — Peit' };

export default function TeamSettingsPage() {
  return <TeamPanel />;
}
