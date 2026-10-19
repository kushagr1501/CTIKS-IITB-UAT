import 'server-only';
import { createHmac } from 'node:crypto';
import { getRedis, redisPrefix, redisOperation } from '@/server/redis/client';
import { getEnvironment } from '@/server/env';
import { HttpError } from '@/server/http/errors';

export function privateRateKey(value: string) {
  return createHmac('sha256', getEnvironment().BETTER_AUTH_SECRET).update(value).digest('hex');
}

export async function consumeRateLimit(key: string, maximum: number, windowSeconds: number) {
  const count = await redisOperation(() =>
    getRedis().eval(
      `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
    return count
  `,
      1,
      `${redisPrefix()}:rate:${key}`,
      windowSeconds,
    ),
  );
  if (Number(count) > maximum)
    throw new HttpError(429, 'Too many attempts. Please wait before trying again.');
}
