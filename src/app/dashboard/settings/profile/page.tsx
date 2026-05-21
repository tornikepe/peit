import type { Metadata } from 'next';
import ProfileForm from '@/components/settings/ProfileForm';

export const metadata: Metadata = { title: 'პროფილი — Peit' };

export default function ProfileSettingsPage() {
  return <ProfileForm />;
}
