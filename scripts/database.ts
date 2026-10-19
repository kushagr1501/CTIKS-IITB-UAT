import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

config({ path: ['.env.migrations.local', '.env.local', '.env'], quiet: true });

export function setupDatabase() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Configure the database before running setup.');
  const url = new URL(connectionString);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) url.searchParams.set('sslmode', 'verify-full');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString(), max: 2 }), log: [] });
}
