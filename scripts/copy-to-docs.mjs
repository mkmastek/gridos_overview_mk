// Copies the single-file build (dist/index.html) to docs/index.html for GitHub Pages
// ("Deploy from a branch" → folder /docs). Run with `npm run pages`.

import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'dist', 'index.html');
const outDir = join(root, 'docs');

if (!existsSync(src)) {
  console.error('dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, 'index.html'));
// Tell GitHub Pages to serve the file as-is (no Jekyll processing).
writeFileSync(join(outDir, '.nojekyll'), '');
const kb = Math.round(statSync(join(outDir, 'index.html')).size / 1024);
console.log(`docs/index.html ready (${kb} KB) — one self-contained file, no other files needed.`);
