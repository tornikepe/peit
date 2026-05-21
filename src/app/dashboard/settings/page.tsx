// Bare /dashboard/settings → redirect to the profile sub-section so
// the URL is always specific enough to deep-link.

import { redirect } from 'next/navigation';

export default function SettingsIndex() {
  redirect('/dashboard/settings/profile');
}
