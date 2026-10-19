import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { readFileSync, statSync } from 'node:fs';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const portFlag = args.findIndex((arg) => arg === '--port' || arg === '-p');
const port = Number(portFlag < 0 ? (process.env.PORT ?? 3000) : args[portFlag + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid development port.');

let generateClient = true;
try {
  const generated = statSync('src/generated/prisma/client.ts');
  const schema = statSync('prisma/schema.prisma');
  const version = JSON.parse(readFileSync(require.resolve('prisma/package.json'), 'utf8')).version;
  const clientClass = readFileSync('src/generated/prisma/internal/class.ts', 'utf8');
  generateClient =
    schema.mtimeMs > generated.mtimeMs || !clientClass.includes(`"clientVersion": "${version}"`);
} catch {
  // A fresh checkout needs its generated client before Next imports database code.
}
if (generateClient) {
  console.log('[dev] Generating Prisma client for the current schema…');
  const code = await new Promise((resolve, reject) => {
    const generator = spawn(process.execPath, [require.resolve('prisma/build/index.js'), 'generate'], {
      stdio: 'inherit',
    });
    generator.once('error', reject);
    generator.once('exit', resolve);
  });
  if (code !== 0) process.exit(typeof code === 'number' ? code : 1);
}

const abort = new AbortController();
const server = spawn(
  process.execPath,
  [
    require.resolve('next/dist/bin/next'),
    'dev',
    '--turbopack',
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port),
    ...args,
  ],
  { stdio: ['inherit', 'pipe', 'inherit'], env: process.env },
);

// Compile public routes sequentially, without serving stale database content or
// creating a second dev server. This runs only once after the server is ready.
async function warmPages() {
  const routes = [
    '/',
    '/people',
    '/activities',
    '/login',
    '/about-us',
    '/academics',
    '/research',
    '/contact-us',
  ];
  console.log('\n[dev] Warming main pages in the background…');
  let warmed = 0;
  for (const route of routes) {
    if (abort.signal.aborted) return;
    const start = performance.now();
    try {
      const response = await fetch(`http://127.0.0.1:${port}${route}`, {
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(60_000)]),
        redirect: 'manual',
      });
      await response.arrayBuffer();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      warmed += 1;
      console.log(`[dev] ${route}: ${response.status} (${Math.round(performance.now() - start)}ms)`);
    } catch (error) {
      if (abort.signal.aborted) return;
      console.warn(`[dev] Could not warm ${route}: ${error.message}`);
    }
  }
  console.log(
    warmed === routes.length
      ? '[dev] Main pages ready. Edits still use Fast Refresh.\n'
      : `[dev] Warm-up finished: ${warmed}/${routes.length} routes ready. See warnings above.\n`,
  );
}

let output = '';
let warming = false;
server.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  output = (output + chunk.toString()).slice(-4096);
  if (!warming && output.includes('Ready in')) {
    warming = true;
    if (process.env.CTIKS_DEV_WARMUP !== '0') void warmPages();
  }
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  abort.abort();
  if (process.platform === 'win32' && server.pid) {
    // Only terminate this launcher's own Next process tree.
    spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    server.kill('SIGTERM');
  }
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
server.on('error', (error) => {
  console.error(`[dev] ${error.message}`);
  abort.abort();
  process.exitCode = 1;
});
server.on('exit', (code) => {
  abort.abort();
  process.exitCode = stopping ? 0 : (code ?? 1);
});
