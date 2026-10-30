import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const databaseGlobal = globalThis as unknown as { ctiksDatabase?: PrismaClient };

export function getDatabase() {
  if (databaseGlobal.ctiksDatabase) return databaseGlobal.ctiksDatabase;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Database connection is not configured.');
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid database protocol.');
  // Verify the server certificate for cloud connections, including Neon.
  const internalPostgres = process.env.CTIKS_INTERNAL_POSTGRES === '1' && url.hostname === 'postgres';
  if (!['localhost', '127.0.0.1'].includes(url.hostname) && !internalPostgres)
    url.searchParams.set('sslmode', 'verify-full');
  const schema = url.searchParams.get('schema') ?? 'public';
  if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error('Invalid database schema.');
  const adapter = new PrismaPg(
    {
      connectionString: url.toString(),
      max: 5,
      connectionTimeoutMillis: 10_000,
      ...(schema !== 'public' ? { options: `-c search_path=${schema}` } : {}),
    },
    { schema },
  );
  const queryTiming = process.env.CTIKS_DB_QUERY_TIMING === '1';
  const database = new PrismaClient({
    adapter,
    log: queryTiming ? [{ emit: 'event', level: 'query' }] : [],
  });
  if (queryTiming) {
    database.$on('query', (event) => {
      // Keep diagnostics useful without logging SQL parameters or profile data.
      const tables = [
        ...event.query.matchAll(/\b(?:from|into|update|join)\s+(?:"?[\w]+"?\.)?"?([\w]+)"?/gi),
      ]
        .map((match) => match[1])
        .filter((table, index, all) => all.indexOf(table) === index);
      console.info(`[db-query] tables=${tables.join(',') || 'other'} duration=${event.duration}ms`);
    });
  }
  databaseGlobal.ctiksDatabase = database;
  return database;
}
