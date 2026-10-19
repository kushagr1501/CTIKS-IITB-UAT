import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: ['.env.migrations.local', '.env.local', '.env'], quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx scripts/seed.ts' },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
});
