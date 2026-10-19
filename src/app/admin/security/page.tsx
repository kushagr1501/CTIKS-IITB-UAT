import SecuritySettings from '@/features/admin/components/SecuritySettings';
import { requirePageActor } from '@/server/auth/page-access';

export default async function SecurityPage() {
  await requirePageActor('faculty.read');
  return <SecuritySettings />;
}
