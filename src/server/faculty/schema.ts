import { z } from 'zod';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/config/password-policy';

const plainText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value),
      'Control characters are not allowed.',
    );

export function isValidImageUrl(value: string) {
  if (!value) return true;
  if (
    process.env.NODE_ENV === 'development' &&
    /^\/api\/local-media\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:\.(?:jpg|png|webp|pdf))?|[a-z0-9][a-z0-9-]{0,79}\.(?:jpg|png|webp|pdf))$/i.test(value)
  ) return true;
  if (/^\/assets\/[a-zA-Z0-9_/-]+\.(png|jpe?g|webp|svg)$/i.test(value) && !value.includes('..')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const facultySchema = z
  .object({
    name: plainText(160).min(2),
    slug: z
      .string()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.'),
    category: z.enum(['CORE', 'ADJUNCT', 'ASSOCIATE', 'VISITING', 'POST_DOCTORAL', 'DOCTORAL_STUDENT']),
    designation: plainText(160),
    department: plainText(300).min(2),
    interests: plainText(1500),
    biography: plainText(8000),
    imageUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(isValidImageUrl, 'Use an HTTPS image URL or an existing /assets/ image.'),
    websiteUrl: z.union([
      z.literal(''),
      z
        .url()
        .max(2048)
        .refine((value) => {
          const url = new URL(value);
          return url.protocol === 'https:' && !url.username && !url.password;
        }, 'Use an HTTPS website URL.'),
    ]),
    publicEmail: z.union([z.literal(''), z.email().max(254)]),
    displayOrder: z.number().int().min(0).max(10000),
    visible: z.boolean(),
  })
  .strict();

export const versionSchema = z.object({ version: z.number().int().positive() }).strict();
export const visibilitySchema = versionSchema.extend({ visible: z.boolean() }).strict();
export const recordIdSchema = z.uuid();

export const facultyLoginSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      .max(MAX_PASSWORD_LENGTH),
  })
  .strict();

const facultyWriteSchema = facultySchema.extend({ login: facultyLoginSchema.optional() });
const coreLoginOnly = (values: { category: string; login?: unknown }) =>
  !values.login || values.category === 'CORE';
const coreLoginMessage = { message: 'Only core faculty can have a login.', path: ['login'] };

export const facultyCreateSchema = facultyWriteSchema
  .partial({ displayOrder: true })
  .transform((values) => {
    // Older clients may still send an order; new profiles always append.
    const data = { ...values };
    delete data.displayOrder;
    return data;
  })
  .refine(coreLoginOnly, coreLoginMessage);
export const facultyUpdateSchema = facultyWriteSchema
  .extend({ version: z.number().int().positive() })
  .refine(coreLoginOnly, coreLoginMessage);
