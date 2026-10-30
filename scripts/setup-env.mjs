import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const template = await readFile('.env.example', 'utf8');
const placeholder = 'generate-a-random-secret-with-at-least-32-characters';
if (!template.includes(placeholder))
  throw new Error('The auth secret placeholder is missing from .env.example.');

const settings = template.replace(placeholder, randomBytes(32).toString('hex'));
try {
  await writeFile('.env.local', settings, { flag: 'wx', mode: 0o600 });
  console.log('Local settings created. Keep .env.local private.');
} catch (error) {
  if (error?.code !== 'EEXIST') throw error;
  console.error('.env.local already exists. No settings were changed.');
  process.exitCode = 1;
}
