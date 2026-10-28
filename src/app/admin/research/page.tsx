import ResearchManager from '@/features/admin/components/ResearchManager';
import { requirePageActor } from '@/server/auth/page-access';
import { listResearchAreas } from '@/server/research/service';
import { getDatabase } from '@/server/database/client';

export default async function AdminResearchPage() {
  const actor = await requirePageActor('research.read');
  const [areas, teachers] = await Promise.all([
    listResearchAreas(actor),
    getDatabase().facultyProfile.findMany({
      where: { category: { not: 'DOCTORAL_STUDENT' } },
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  return (
    <ResearchManager
      initialAreas={areas}
      teacherNames={[...new Set(teachers.map((teacher) => teacher.name))]}
    />
  );
}
