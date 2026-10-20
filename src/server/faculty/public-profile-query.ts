// Explicit public projection: never select login, drafts, reviewer or audit data.
// Kept independent of server initialization so integration tests exercise this query.
export function publicCoreProfileQuery(slug: string) {
  return {
    where: { slug, visible: true, category: 'CORE' as const },
    select: {
      name: true,
      slug: true,
      designation: true,
      department: true,
      biography: true,
      interests: true,
      imageUrl: true,
      websiteUrl: true,
      publicEmail: true,
      revisions: {
        where: { status: 'PUBLISHED' as const },
        take: 1,
        select: {
          researchTags: true,
          researchOverview: true,
          officeAddress: true,
          publicPhone: true,
          education: {
            orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }],
            select: { id: true, title: true, institution: true, description: true, periodText: true },
          },
          experience: {
            orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }],
            select: { id: true, title: true, organisation: true, description: true, periodText: true },
          },
          courses: {
            orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }],
            select: { id: true, title: true, code: true, periodText: true, description: true, status: true },
          },
          publications: {
            orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }],
            select: {
              id: true,
              title: true,
              type: true,
              authors: true,
              venue: true,
              year: true,
              citation: true,
              doi: true,
              url: true,
            },
          },
          patents: {
            orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }],
            select: {
              id: true,
              title: true,
              inventors: true,
              identifier: true,
              status: true,
              year: true,
              description: true,
              url: true,
            },
          },
          students: {
            orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }],
            select: {
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
            },
          },
        },
      },
    },
  };
}
