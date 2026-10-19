import { z } from 'zod';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/config/password-policy';

const password = z.string().min(1).max(MAX_PASSWORD_LENGTH);
const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(MAX_PASSWORD_LENGTH);

export const authRequestSchemas = {
  '/sign-in/email': z
    .object({
      email: z.email().trim().toLowerCase(),
      password,
      rememberMe: z.literal(true).optional(),
    })
    .strict(),
  '/sign-out': z.object({}).strict(),
  '/change-password': z
    .object({ currentPassword: password, newPassword, revokeOtherSessions: z.literal(true).default(true) })
    .strict()
    .refine((value) => value.currentPassword !== value.newPassword, 'Choose a different password.'),
} as const;

export function isAuthPath(path: string): path is keyof typeof authRequestSchemas {
  return Object.hasOwn(authRequestSchemas, path);
}
