import { redisStorage } from '@better-auth/redis-storage';
import type { Redis } from 'ioredis';
import type { SecondaryStorage } from 'better-auth';
import { z } from 'zod';
import { IDLE_SECONDS } from './policy';

const envelopeSchema = z
  .object({
    session: z
      .object({
        id: z.string(),
        userId: z.string(),
        expiresAt: z.coerce.date(),
        lastActiveAt: z.coerce.date(),
      })
      .passthrough(),
    user: z.object({ id: z.string(), name: z.string(), email: z.string() }).passthrough(),
  })
  .passthrough();

export type ExpiryRecord = {
  sessionId: string;
  actor: { id: string; name: string; email: string };
  expiresAt: string;
  lastActivityAt: string;
  deadline: number;
};

export function authKeys(namespace: string) {
  return {
    prefix: `${namespace}:auth:`,
    history: `${namespace}:session-history`,
    deadlines: `${namespace}:session-deadlines`,
  };
}

function sessionEnvelope(value: string) {
  try {
    return envelopeSchema.safeParse(JSON.parse(value)).data;
  } catch {
    return undefined;
  }
}

function checkTransaction(results: [Error | null, unknown][] | null) {
  if (!results) throw new Error('Redis transaction aborted.');
  for (const [error] of results) if (error) throw error;
}

export function createAuthStorage(redis: Redis, namespace: string): SecondaryStorage {
  const keys = authKeys(namespace);
  const base = redisStorage({ client: redis, keyPrefix: keys.prefix });
  async function remove(key: string) {
    const value = await redis.getdel(keys.prefix + key);
    const envelope = value ? sessionEnvelope(value) : undefined;
    if (envelope) {
      const deadline = Math.min(
        envelope.session.expiresAt.getTime(),
        envelope.session.lastActiveAt.getTime() + IDLE_SECONDS * 1000,
      );
      // Expired records remain queued until their audit event is committed to Neon.
      if (deadline > Date.now())
        checkTransaction(
          await redis
            .multi()
            .hdel(keys.history, envelope.session.id)
            .zrem(keys.deadlines, envelope.session.id)
            .exec(),
        );
    }
    return value;
  }
  return {
    ...base,
    async set(key, value, ttl) {
      const envelope = sessionEnvelope(value);
      if (!envelope) return base.set(key, value, ttl);
      const { session, user } = envelope;
      const deadline = Math.min(
        session.expiresAt.getTime(),
        session.lastActiveAt.getTime() + IDLE_SECONDS * 1000,
      );
      const record: ExpiryRecord = {
        sessionId: session.id,
        actor: { id: user.id, name: user.name, email: user.email },
        expiresAt: session.expiresAt.toISOString(),
        lastActivityAt: session.lastActiveAt.toISOString(),
        deadline,
      };
      const transaction = redis.multi();
      const remaining = deadline - Date.now();
      if (remaining > 0) transaction.set(keys.prefix + key, value, 'PX', remaining);
      else transaction.del(keys.prefix + key);
      transaction
        .hset(keys.history, session.id, JSON.stringify(record))
        .zadd(keys.deadlines, deadline, session.id);
      checkTransaction(await transaction.exec());
    },
    async delete(key) {
      await remove(key);
    },
    getAndDelete: remove,
  };
}

export async function touchSession(redis: Redis, namespace: string, token: string, absoluteExpiry: Date) {
  const keys = authKeys(namespace);
  const now = Date.now();
  const deadline = Math.min(absoluteExpiry.getTime(), now + IDLE_SECONDS * 1000);
  if (deadline <= now) return false;
  // GET and SET happen atomically: an in-flight request cannot recreate a revoked session.
  const changed = await redis.eval(
    `
    local raw = redis.call('GET', KEYS[1])
    if not raw then return 0 end
    local value = cjson.decode(raw)
    local record = redis.call('HGET', KEYS[2], value.session.id)
    if not record then return 0 end
    local history = cjson.decode(record)
    if tonumber(history.deadline) <= tonumber(ARGV[1]) then return 0 end
    value.session.lastActiveAt = ARGV[2]
    history.lastActivityAt = ARGV[2]
    history.deadline = tonumber(ARGV[3])
    redis.call('SET', KEYS[1], cjson.encode(value), 'PX', ARGV[4], 'XX')
    redis.call('HSET', KEYS[2], value.session.id, cjson.encode(history))
    redis.call('ZADD', KEYS[3], ARGV[3], value.session.id)
    return 1
  `,
    3,
    keys.prefix + token,
    keys.history,
    keys.deadlines,
    now,
    new Date(now).toISOString(),
    deadline,
    deadline - now,
  );
  return changed === 1;
}

export async function pendingSessionExpiries(redis: Redis, namespace: string) {
  const keys = authKeys(namespace);
  const ids = await redis.zrangebyscore(keys.deadlines, '-inf', Date.now(), 'LIMIT', 0, 200);
  if (!ids.length) return [];
  const records = await redis.hmget(keys.history, ...ids);
  return records.flatMap((raw, index) =>
    raw ? [{ id: ids[index], raw, record: JSON.parse(raw) as ExpiryRecord }] : [],
  );
}

export async function acknowledgeSessionExpiry(redis: Redis, namespace: string, id: string, raw: string) {
  const keys = authKeys(namespace);
  await redis.eval(
    `
    if redis.call('HGET', KEYS[1], ARGV[1]) ~= ARGV[2] then return 0 end
    redis.call('HDEL', KEYS[1], ARGV[1])
    redis.call('ZREM', KEYS[2], ARGV[1])
    return 1
  `,
    2,
    keys.history,
    keys.deadlines,
    id,
    raw,
  );
}
