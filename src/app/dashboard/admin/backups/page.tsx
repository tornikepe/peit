import PageHeader from '@/components/dashboard-shell/PageHeader';
import BackupLogView from '@/components/dashboard/BackupLogView';

export const metadata = { title: 'Backups — Peit' };

// Admin-only page. Access control is enforced by the data API
// (GET /api/admin/backups → 403 for non-admins); the view renders an
// "admin only" message in that case. Not linked in the sidebar.
export default function AdminBackupsPage() {
  return (
    <>
      <PageHeader
        eyebrow="ADMIN"
        title="Database backups"
        subtitle="ბაზის backup-ების ყოველდღიური აუდიტი (Neon managed + point-in-time recovery)."
      />
      <BackupLogView />
    </>
  );
}
