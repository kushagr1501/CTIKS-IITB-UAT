import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const connection =
  'postgresql://ctiks_dev:ctiks_dev_local_only@127.0.0.1:15432/ctiks_dev?schema=public';
const command = process.argv[2];
if (!['migrate', 'seed'].includes(command)) throw new Error('Use the migrate or seed command.');

// Force local DB settings before Prisma loads its config or dotenv files.
const env = {
  ...process.env,
  DATABASE_URL: connection,
  DIRECT_URL: connection,
  ...(command === 'seed' ? { ADMIN_CREDENTIALS_FILE: '.private/local-admin-credentials.txt' } : {}),
};
const args =
  command === 'migrate'
    ? [require.resolve('prisma/build/index.js'), 'migrate', 'deploy']
    : [resolve('node_modules/tsx/dist/cli.mjs'), 'scripts/seed.ts'];
const child = spawn(process.execPath, args, { stdio: 'inherit', env });
child.once('error', (error) => {
  console.error(`[db:local:${command}] ${error.message}`);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
