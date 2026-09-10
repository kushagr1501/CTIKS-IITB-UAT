/**
 * Downloads every Figma-exported asset into public/assets/.
 * Run this soon: Figma MCP asset URLs expire about 7 days after export.
 *
 *   npm run fetch:assets
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_LIST } from '../src/assets/assets.js';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/assets');
await mkdir(outDir, { recursive: true });

let ok = 0;
let failed = 0;

for (const { file, remote } of ASSET_LIST) {
  try {
    const res = await fetch(remote);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(resolve(outDir, file), Buffer.from(await res.arrayBuffer()));
    console.log(`  ok    ${file}`);
    ok += 1;
  } catch (err) {
    console.error(`  FAIL  ${file} — ${err.message}`);
    failed += 1;
  }
}

console.log(`\n${ok} downloaded, ${failed} failed.`);
if (failed) {
  console.error('Failed URLs have most likely expired. Re-export from Figma to refresh them.');
  process.exitCode = 1;
}
