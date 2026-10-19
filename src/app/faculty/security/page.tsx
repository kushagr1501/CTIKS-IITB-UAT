import SecuritySettings from '@/features/admin/components/SecuritySettings';
import { requirePageActor } from '@/server/auth/page-access';

export default async function FacultySecurityPage() {
  await requirePageActor('faculty.self.read');
  return <SecuritySettings />;
}
