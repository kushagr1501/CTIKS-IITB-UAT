import 'server-only';
import { getDatabase } from '@/server/database/client';
import { cache } from 'react';
import { publicCoreProfileQuery } from './public-profile-query';

export const getPublicCoreFacultyProfile = cache((slug: string) =>
  getDatabase().facultyProfile.findFirst(publicCoreProfileQuery(slug)),
);

export const getPublicCoreFacultyOverview = cache(async (slug: string) => {
  const database = getDatabase();
  const profile = await database.facultyProfile.findFirst(
    publicCoreProfileQuery(slug, { publications: 6, patents: 6, students: 0 }),
  );
  const academic = profile?.revisions[0];
  if (!profile || !academic)
    return { profile, totals: { publications: 0, patents: 0, graduated: 0, current: 0 } };

  const revisionId = academic.id;
  const studentSelect = {
    id: true,
    name: true,
    programme: true,
    biography: true,
    researchTopic: true,
    supervisionRole: true,
    periodText: true,
    status: true,
    graduationYear: true,
    imageUrl: true,
    socialLinks: true,
  } as const;
  const orderBy = [{ displayOrder: 'asc' as const }, { id: 'asc' as const }];
  const [publications, patents, graduated, current, graduatedStudents, currentStudents] =
    await Promise.all([
      database.facultyPublication.count({ where: { revisionId } }),
      database.facultyPatent.count({ where: { revisionId } }),
      database.facultyStudent.count({ where: { revisionId, status: 'GRADUATED' } }),
      database.facultyStudent.count({ where: { revisionId, status: 'CURRENT' } }),
      database.facultyStudent.findMany({
        where: { revisionId, status: 'GRADUATED' },
        orderBy,
        take: 6,
        select: studentSelect,
      }),
      database.facultyStudent.findMany({
        where: { revisionId, status: 'CURRENT' },
        orderBy,
        take: 6,
        select: studentSelect,
      }),
    ]);
  return {
    profile: {
      ...profile,
      revisions: [{ ...academic, students: [...graduatedStudents, ...currentStudents] }],
    },
    totals: { publications, patents, graduated, current },
  };
});

export const getPublicCoreCollectionContext = cache((slug: string) =>
  getDatabase().facultyProfile.findFirst({
    where: { slug, visible: true, category: 'CORE' },
    select: {
      name: true,
      slug: true,
      revisions: {
        where: { status: 'PUBLISHED' },
        take: 1,
        select: { id: true },
      },
    },
  }),
);

export function getVisibleFaculty() {
  return getDatabase().facultyProfile.findMany({
    where: { visible: true },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      designation: true,
      department: true,
      interests: true,
      biography: true,
      imageUrl: true,
      websiteUrl: true,
      publicEmail: true,
    },
  });
}

export function getPublicPeopleMenu() {
  return getDatabase().facultyProfile.findMany({
    where: { visible: true },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    select: { name: true, slug: true, category: true, websiteUrl: true },
  });
}
