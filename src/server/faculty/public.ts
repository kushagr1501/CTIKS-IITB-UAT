import 'server-only';
import { getDatabase } from '@/server/database/client';
import { cache } from 'react';
import { publicCoreProfileQuery } from './public-profile-query';

export const getPublicCoreFacultyProfile = cache((slug: string) =>
  getDatabase().facultyProfile.findFirst(publicCoreProfileQuery(slug)),
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
