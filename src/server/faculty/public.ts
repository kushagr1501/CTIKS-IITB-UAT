import 'server-only';
import { getDatabase } from '@/server/database/client';

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
