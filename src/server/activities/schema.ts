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
const fields = z
  .object({
    title: text(200).min(2),
    description: text(8000).min(1),
    sections: z
      .array(z.enum(['NEWS', 'ANNOUNCEMENT', 'EVENT']))
      .min(1)
      .max(3)
      .refine((sections) => new Set(sections).size === sections.length, 'Choose each section only once.'),
    imageUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(isValidImageUrl, 'Use an HTTPS image URL or an existing /assets/ image.'),
    eventStartAt: z.iso.datetime({ offset: true }).nullable(),
    eventEndAt: z.iso.datetime({ offset: true }).nullable(),
    venue: text(300),
    registrationUrl: z.union([
      z.literal(''),
      z
        .url()
        .max(2048)
        .refine((value) => {
          const url = new URL(value);
          return url.protocol === 'https:' && !url.username && !url.password;
        }, 'Use an HTTPS link.'),
    ]),
    linkLabel: text(60).default(''),
    visible: z.boolean(),
  })
  .strict();

function validRange(values: { eventStartAt: string | null; eventEndAt: string | null }) {
  return (
    !values.eventEndAt ||
    (values.eventStartAt !== null && Date.parse(values.eventEndAt) > Date.parse(values.eventStartAt))
  );
}
const rangeMessage = { message: 'End date and time must be after the start.', path: ['eventEndAt'] };
export const activityCreateSchema = fields.refine(validRange, rangeMessage);
export const activityUpdateSchema = fields
  .extend({ version: z.number().int().positive() })
  .refine(validRange, rangeMessage);
