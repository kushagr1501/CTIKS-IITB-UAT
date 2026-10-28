import 'server-only';
import { cache } from 'react';
import type { Prisma } from '@/generated/prisma/client';
import { getDatabase } from '@/server/database/client';
import { ACTIVITY_SECTIONS, isActivitySection, type ActivitySection } from '@/features/activities/types';

const select = {
  id: true,
  title: true,
  description: true,
  sections: true,
  imageUrl: true,
  supportingDocumentUrl: true,
  eventHasTime: true,
  eventStartAt: true,
  eventEndAt: true,
  venue: true,
  registrationUrl: true,
  linkLabel: true,
  createdAt: true,
} as const;
const orderBy = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies Prisma.ActivityOrderByWithRelationInput[];
function serialize(activity: Prisma.ActivityGetPayload<{ select: typeof select }>) {
  return {
    ...activity,
    sections: activity.sections.filter(isActivitySection),
    createdAt: activity.createdAt.toISOString(),
    eventStartAt: activity.eventStartAt?.toISOString() ?? null,
    eventEndAt: activity.eventEndAt?.toISOString() ?? null,
  };
}

export type ActivityTimeFilter = 'all' | 'upcoming' | 'past';

export function activityTimeWhere(filter: ActivityTimeFilter, now = new Date()): Prisma.ActivityWhereInput {
  if (filter === 'all') return {};
  const dayAgo = new Date(now.getTime() - 86400000);
  return {
    eventStartAt: { not: null },
    OR:
      filter === 'past'
        ? [
            { eventEndAt: { lte: now } },
            { eventEndAt: null, eventHasTime: true, eventStartAt: { lt: now } },
            { eventEndAt: null, eventHasTime: false, eventStartAt: { lte: dayAgo } },
          ]
        : [
            { eventEndAt: { gt: now } },
            { eventEndAt: null, eventHasTime: true, eventStartAt: { gte: now } },
            { eventEndAt: null, eventHasTime: false, eventStartAt: { gt: dayAgo } },
          ],
  };
}

export async function getPublicActivities(
  section?: ActivitySection,
  query = '',
  requestedPage = 1,
  time: ActivityTimeFilter = 'all',
) {
  const where: Prisma.ActivityWhereInput = {
    visible: true,
    ...(section ? { sections: { has: section } } : {}),
    AND: [
      activityTimeWhere(time),
      ...(query
        ? [
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' as const } },
                { description: { contains: query, mode: 'insensitive' as const } },
              ],
            },
          ]
        : []),
    ],
  };
  const db = getDatabase();
  const total = await db.activity.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const items = await db.activity.findMany({ where, select, orderBy, take: 12, skip: (page - 1) * 12 });
  return { items: items.map(serialize), total, page, pageCount };
}

export const getPublicActivityCounts = cache(async (query = '', time: ActivityTimeFilter = 'all') => {
  const groups = await getDatabase().activity.groupBy({
    by: ['sections'],
    where: {
      visible: true,
      AND: [
        activityTimeWhere(time),
        ...(query
          ? [
              {
                OR: [
                  { title: { contains: query, mode: 'insensitive' as const } },
                  { description: { contains: query, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    },
    _count: { _all: true },
  });
  const sections = Object.fromEntries(Object.keys(ACTIVITY_SECTIONS).map((key) => [key, 0])) as Record<
    ActivitySection,
    number
  >;
  let total = 0;
  for (const group of groups) {
    total += group._count._all;
    for (const section of group.sections)
      if (isActivitySection(section)) sections[section] += group._count._all;
  }
  return { total, sections };
});

export async function getHomepageActivities(now = new Date()) {
  const db = getDatabase();
  const [events, announcements] = await Promise.all([
    db.activity.findMany({
      where: {
        visible: true,
        sections: { has: 'EVENT' },
        eventStartAt: { not: null },
        OR: [
          { eventEndAt: { gt: now } },
          { eventEndAt: null, eventHasTime: true, eventStartAt: { gte: now } },
          {
            eventEndAt: null,
            eventHasTime: false,
            eventStartAt: { gte: new Date(now.getTime() - 86400000) },
          },
        ],
      },
      select,
      orderBy: [{ eventStartAt: 'asc' }, { id: 'asc' }],
      take: 12,
    }),
    db.activity.findMany({
      where: { visible: true, sections: { has: 'ANNOUNCEMENT' } },
      select,
      orderBy,
      take: 2,
    }),
  ]);
  return { events: events.map(serialize), announcements: announcements.map(serialize) };
}
