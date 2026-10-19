import { z } from 'zod';
import { isValidImageUrl } from '@/server/faculty/schema';

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value),
      'Control characters are not allowed.',
    );
const url = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  }, 'Use an HTTPS URL.');
const year = z.number().int().min(1000).max(9999).nullable();
export const academicContentSchema = z
  .object({
    biography: text(8000),
    imageUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(isValidImageUrl, 'Use an HTTPS image URL or an existing /assets/ image.'),
    websiteUrl: url,
    publicEmail: z.union([z.literal(''), z.string().trim().pipe(z.email().max(254))]),
    interests: text(1500),
    researchTags: z
      .array(text(100).min(1))
      .max(30)
      .refine(
        (tags) => new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length,
        'Remove duplicate research areas.',
      ),
    researchOverview: text(8000),
    officeAddress: text(2000),
    publicPhone: text(100),
    education: z
      .array(
        z
          .object({
            title: text(300).min(1),
            institution: text(400),
            description: text(3000),
            periodText: text(200),
          })
          .strict(),
      )
      .max(100),
    experience: z
      .array(
        z
          .object({
            title: text(300).min(1),
            organisation: text(400),
            description: text(3000),
            periodText: text(200),
          })
          .strict(),
      )
      .max(100),
    courses: z
      .array(
        z
          .object({
            title: text(300).min(1),
            code: text(80),
            description: text(3000),
            periodText: text(200),
            status: z.enum(['CURRENT', 'PREVIOUS']),
          })
          .strict(),
      )
      .max(150),
    publications: z
      .array(
        z
          .object({
            title: text(1000).min(1),
            type: z.enum([
              'JOURNAL_ARTICLE',
              'CONFERENCE_PAPER',
              'BOOK',
              'BOOK_CHAPTER',
              'RESEARCH_MONOGRAPH',
            ]),
            authors: text(2000),
            venue: text(2000),
            year,
            citation: text(5000),
            doi: text(300),
            url,
          })
          .strict(),
      )
      .max(500),
    patents: z
      .array(
        z
          .object({
            title: text(1000).min(1),
            inventors: text(2000),
            identifier: text(300),
            status: text(120),
            year,
            description: text(5000),
            url,
          })
          .strict(),
      )
      .max(100),
    students: z
      .array(
        z
          .object({
            name: text(200).min(1),
            programme: text(200),
            researchTopic: text(2000),
            supervisionRole: text(200),
            periodText: text(200),
            status: z.enum(['CURRENT', 'GRADUATED']),
            graduationYear: year,
          })
          .strict()
          .refine((entry) => entry.status === 'GRADUATED' || entry.graduationYear === null, {
            path: ['graduationYear'],
            message: 'Only graduated students can have a graduation year.',
          }),
      )
      .max(300),
  })
  .strict();
export const facultyContentRequestSchema = z
  .object({
    action: z.enum(['save', 'publish', 'discard']),
    profileVersion: z.number().int().positive(),
    draftVersion: z.number().int().positive().nullable(),
    content: academicContentSchema,
  })
  .strict();
export type AcademicContent = z.infer<typeof academicContentSchema>;
export type FacultyContentRequest = z.infer<typeof facultyContentRequestSchema>;
export type FacultyEditorState = {
  identity: { name: string; slug: string; designation: string; department: string; visible: boolean };
  profileVersion: number;
  draftVersion: number | null;
  hasDraft: boolean;
  content: AcademicContent;
};
