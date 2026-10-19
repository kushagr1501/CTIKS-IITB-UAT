export const ACTIVITY_SECTIONS = {
  NEWS: 'News',
  ANNOUNCEMENT: 'Announcements',
  EVENT: 'Events',
} as const;

export type ActivitySection = keyof typeof ACTIVITY_SECTIONS;
export function isActivitySection(value: string): value is ActivitySection {
  return Object.hasOwn(ACTIVITY_SECTIONS, value);
}
export const ACTIVITY_PATHS: Record<ActivitySection, string> = {
  NEWS: '/news',
  ANNOUNCEMENT: '/announcements',
  EVENT: '/events',
};

export type ActivityValues = {
  title: string;
  description: string;
  sections: ActivitySection[];
  imageUrl: string;
  eventStartAt: string | null;
  eventEndAt: string | null;
  venue: string;
  registrationUrl: string;
  linkLabel: string;
  visible: boolean;
};

export type ActivityRecord = ActivityValues & {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicActivity = Omit<ActivityRecord, 'visible' | 'version' | 'updatedAt'>;
