import { z } from 'zod';
import { isValidImageUrl } from '@/server/faculty/schema';

const fields = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(8000),
    imageUrl: z
      .string()
      .trim()
      .min(1)
      .max(2048)
      .refine(isValidImageUrl, 'Use an HTTPS image URL, an existing /assets/ image, or upload an image.'),
    professorNames: z
      .array(z.string().trim().min(2).max(160))
      .max(30)
      .refine((names) => new Set(names).size === names.length, 'Choose each professor once.'),
    displayOrder: z.number().int().min(0).max(10000),
    visible: z.boolean(),
  })
  .strict();

export const researchCreateSchema = fields;
export const researchUpdateSchema = fields.extend({ version: z.number().int().positive() });
export const researchVersionSchema = z.object({ version: z.number().int().positive() }).strict();
export const researchVisibilitySchema = researchVersionSchema.extend({ visible: z.boolean() });
export const researchIdSchema = z.uuid();
