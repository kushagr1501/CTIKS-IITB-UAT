import 'server-only';
import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.url().refine((value) => ['redis:', 'rediss:'].includes(new URL(value).protocol)),
  REDIS_NAMESPACE: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,80}$/)
    .default('ctiks'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

export function getEnvironment() {
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) throw new Error('Backend environment is incomplete. See .env.example.');
  const url = new URL(result.data.BETTER_AUTH_URL);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('Production authentication requires an HTTPS application URL.');
  }
  return { ...result.data, origin: url.origin };
}
