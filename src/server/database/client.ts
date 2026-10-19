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
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) url.searchParams.set('sslmode', 'verify-full');
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
  const database = new PrismaClient({ adapter, log: [] });
  databaseGlobal.ctiksDatabase = database;
  return database;
}
