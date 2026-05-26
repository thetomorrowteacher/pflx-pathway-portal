// Build the pflx3d module to a single self-contained file at public/pflx3d.js
// that pathway.html can include via <script>. Uses esbuild (which Next.js
// already pulls in transitively, so no extra install needed).
//
// Usage:
//   node scripts/build-3d.mjs        # one-shot build
//   node scripts/build-3d.mjs --watch  # rebuild on change

import { build, context } from 'esbuild';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENTRY = resolve(ROOT, 'src/pflx3d/index.ts');
const OUTFILE = resolve(ROOT, 'public/pflx3d.js');

if (!existsSync(dirname(OUTFILE))) mkdirSync(dirname(OUTFILE), { recursive: true });

const watch = process.argv.includes('--watch');

const opts = {
  entryPoints: [ENTRY],
  outfile: OUTFILE,
  bundle: true,
  format: 'iife',
  globalName: 'PflxBundle', // unused; we bind window.Pflx3D inside the module
  target: ['es2019'],
  platform: 'browser',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  legalComments: 'none',
  // Tree-shake aggressively. three is large; we only pull in what we touch.
  treeShaking: true,
  banner: { js: '/* pflx3d — built by scripts/build-3d.mjs */' },
  loader: { '.ts': 'ts' },
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log('[pflx3d] watching for changes…');
} else {
  await build(opts);
  console.log('[pflx3d] built →', OUTFILE);
}
