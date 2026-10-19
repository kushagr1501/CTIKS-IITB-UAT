import { z } from 'zod';
import { isValidImageUrl } from '@/server/faculty/schema';

export const STUDENT_LINK_PLATFORMS = [
  'WEBSITE',
  'LINKEDIN',
  'GOOGLE_SCHOLAR',
  'ORCID',
  'RESEARCHGATE',
  'GITHUB',
  'X',
  'INSTAGRAM',
] as const;
export const STUDENT_LINK_LABELS: Record<(typeof STUDENT_LINK_PLATFORMS)[number], string> = {
  WEBSITE: 'Personal website',
  LINKEDIN: 'LinkedIn',
  GOOGLE_SCHOLAR: 'Google Scholar',
  ORCID: 'ORCID',
  RESEARCHGATE: 'ResearchGate',
  GITHUB: 'GitHub',
  X: 'X',
  INSTAGRAM: 'Instagram',
};
export const studentPhotoSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(isValidImageUrl, 'Use an HTTPS photo URL or an existing /assets/ image.');
const studentLinkSchema = z
  .object({
    platform: z.enum(STUDENT_LINK_PLATFORMS),
    url: z
      .string()
      .trim()
      .min(1, 'Enter a link URL.')
      .max(2048)
      .refine((value) => {
        try {
          const url = new URL(value);
          return url.protocol === 'https:' && !url.username && !url.password;
        } catch {
          return false;
        }
      }, 'Use an HTTPS URL.'),
  })
  .strict();
export const studentSocialLinksSchema = z
  .array(studentLinkSchema)
  .max(STUDENT_LINK_PLATFORMS.length)
  .refine(
    (links) => new Set(links.map((link) => link.platform)).size === links.length,
    'Add each platform only once.',
  );
export type StudentSocialLink = z.infer<typeof studentLinkSchema>;
export function readStudentSocialLinks(value: unknown): StudentSocialLink[] {
  const parsed = studentSocialLinksSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
