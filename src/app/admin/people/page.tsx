import FacultyManager from '@/features/admin/components/FacultyManager';
import { requirePageActor } from '@/server/auth/page-access';
import { listFaculty } from '@/server/faculty/service';

export default async function AdminPeoplePage() {
  const actor = await requirePageActor('faculty.read');
  const profiles = await listFaculty(actor);
  const faculty = profiles.map((profile) => ({
    ...profile,
    updatedAt: profile.updatedAt.toISOString(),
  }));
  return <FacultyManager initialFaculty={faculty} />;
}
