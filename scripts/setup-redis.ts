import { randomBytes } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { parse } from 'dotenv';

const filename = '.env.local';
const source = await readFile(filename, 'utf8');
const values = parse(source);
if (values.REDIS_URL) {
  console.log('Redis is already configured. Existing credentials were preserved.');
} else {
  const password = randomBytes(32).toString('hex');
  await mkdir('.private', { recursive: true });
  await writeFile('.private/redis-credentials.conf', `requirepass ${password}\n`, {
    mode: 0o600,
    flag: 'wx',
  });
  await writeFile(
    filename,
    `${source.trimEnd()}\nREDIS_URL="redis://:${password}@127.0.0.1:16379"\nREDIS_NAMESPACE="ctiks"\n`,
  );
  console.log('Local Redis credentials configured. Secrets omitted from logs.');
}
