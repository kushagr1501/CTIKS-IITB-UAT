import 'server-only';
import { betterAuth } from 'better-auth';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/config/password-policy';
import { getDatabase } from '@/server/database/client';
import { getEnvironment } from '@/server/env';
import { getRedis, redisPrefix } from '@/server/redis/client';
import { hashPassword, verifyPassword } from './passwords';
import { credentialAdapter } from './credential-adapter';
import { createAuthStorage } from './redis-storage';
import { SESSION_SECONDS } from './policy';
import { canSignIn } from './permissions';

function createAuth() {
  const environment = getEnvironment();
  const database = getDatabase();
  return betterAuth({
    appName: 'CTIKS IIT Bombay',
    logger: { disabled: true },
    baseURL: environment.origin,
    secret: environment.BETTER_AUTH_SECRET,
    trustedOrigins: [environment.origin],
    database: credentialAdapter(database),
    secondaryStorage: createAuthStorage(getRedis(), redisPrefix()),
    verification: { storeInDatabase: false },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: false,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'CORE_FACULTY', input: false },
      },
    },
    session: {
      storeSessionInDatabase: false,
      expiresIn: SESSION_SECONDS,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
      additionalFields: {
        lastActiveAt: { type: 'date', input: false, required: false, returned: false },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      cookiePrefix: 'ctiks',
      defaultCookieAttributes: { httpOnly: true, sameSite: 'strict', path: '/' },
      // Proxy trust is deferred. The API wrapper applies Redis-backed account
      // and global limits without trusting visitor-supplied IP headers.
      ipAddress: { disableIpTracking: true },
    },
    rateLimit: { enabled: false },
    databaseHooks: {
      session: {
        create: {
          async before(session) {
            const user = await database.user.findUnique({
              where: { id: session.userId },
              include: { facultyProfile: { select: { category: true } } },
            });
            if (!user || !canSignIn(user.role, user.facultyProfile?.category)) return false;
            return {
              data: {
                ...session,
                expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
                lastActiveAt: new Date(),
              },
            };
          },
        },
      },
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
