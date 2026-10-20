import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const uat = dotenv.parse(readFileSync('.env.uat.local'));
const local = dotenv.parse(readFileSync('.env.local'));
const directUrl = new URL(uat.DIRECT_URL ?? '');
if (!directUrl.hostname.endsWith('.neon.tech'))
  throw new Error('UAT integration tests require a Neon DIRECT_URL in .env.uat.local.');
if (!uat.DATABASE_URL || !local.REDIS_URL)
  throw new Error('UAT database URLs and local Redis must be configured before testing.');

console.log(`Running isolated API/browser integration tests against Neon host ${directUrl.hostname}.`);
console.log('The integration harness creates and drops a random test schema and uses an isolated Redis namespace.');
const child = spawn(
  process.execPath,
  [require.resolve('tsx/cli'), 'scripts/test-integration.ts'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: uat.DATABASE_URL,
      DIRECT_URL: uat.DIRECT_URL,
      REDIS_URL: local.REDIS_URL,
      CTIKS_DB_QUERY_TIMING: '1',
    },
  },
);
child.once('error', (error) => {
  console.error(`[test:uat] ${error.message}`);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
