import type { Metadata } from 'next';
import NotificationsPanel from '@/components/settings/NotificationsPanel';

export const metadata: Metadata = { title: 'ნოტიფიკაციები — Peit' };

export default function NotificationsSettingsPage() {
  return <NotificationsPanel />;
}
