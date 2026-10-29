import 'server-only';
import { Redis } from 'ioredis';
import { getEnvironment } from '@/server/env';
import { HttpError } from '@/server/http/errors';
import { safeRedisFailureMessage } from './failure-message';

const shared = globalThis as unknown as { ctiksRedis?: Redis };

export function getRedis() {
  if (!shared.ctiksRedis) {
    shared.ctiksRedis = new Redis(getEnvironment().REDIS_URL, {
      connectTimeout: 3000,
      commandTimeout: 5000,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 250, 2000),
    });
    // Errors are returned through request handlers without logging credentials.
    shared.ctiksRedis.on('error', () => {});
  }
  return shared.ctiksRedis;
}

export function redisPrefix() {
  return getEnvironment().REDIS_NAMESPACE;
}

type RedisOperationName =
  | 'read session expiries'
  | 'acknowledge session expiry'
  | 'revoke faculty sessions'
  | 'touch session'
  | 'consume rate limit';

export async function redisOperation<T>(name: RedisOperationName, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', name, safeRedisFailureMessage(error));
    throw new HttpError(503, 'Authentication storage is temporarily unavailable. Please try again.');
  }
}
