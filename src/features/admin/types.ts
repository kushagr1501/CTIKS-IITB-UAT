export const FACULTY_CATEGORIES = {
  CORE: 'Core Faculty',
  ADJUNCT: 'Adjunct Faculty',
  ASSOCIATE: 'Associate Faculty',
  VISITING: 'Visiting Faculty',
} as const;

export type FacultyCategory = keyof typeof FACULTY_CATEGORIES;
export type FacultyValues = {
  name: string;
  slug: string;
  category: FacultyCategory;
  designation: string;
  department: string;
  interests: string;
  biography: string;
  imageUrl: string;
  websiteUrl: string;
  publicEmail: string;
  displayOrder: number;
  visible: boolean;
};
export type FacultyRecord = FacultyValues & {
  id: string;
  version: number;
  updatedAt: string;
  loginEmail: string | null;
};

export type FacultyLogin = { email: string; password: string };
export type FacultySubmission = FacultyValues & { login?: FacultyLogin };

export type AuditRecord = {
  id: string;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  targetName: string | null;
  createdAt: string;
  before: unknown;
  after: unknown;
  details: unknown;
};
export type AuditResult = {
  events: AuditRecord[];
  total: number;
  page: number;
  pageSize: number;
};
