import 'server-only';
import { Redis } from 'ioredis';
import { getEnvironment } from '@/server/env';
import { HttpError } from '@/server/http/errors';

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

export async function redisOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch {
    throw new HttpError(503, 'Authentication storage is temporarily unavailable. Please try again.');
  }
}
