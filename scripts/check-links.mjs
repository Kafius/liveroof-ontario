// Verify every internal link and local asset reference in dist/ resolves to a
// file that exists. Run after `astro build`.
//
// This exists because the site once shipped 16 internal links to routes that
// had never been created — the Footer pointed at /products/modules,
// /technical/leed and so on, none of which are local pages. Nothing in the
// build catches that: Astro happily emits a dead href.
//
//   node scripts/check-links.mjs
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('  dist/ not found — run `npm run build` first.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** A root-relative URL resolves if it maps to a file or a directory index. */
function resolves(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (!clean.startsWith('/')) return true; // external or relative — not our concern
  const candidates = [
    join(DIST, clean),
    join(DIST, clean, 'index.html'),
    join(DIST, `${clean}.html`),
  ];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
}

const pages = walk(DIST);
const problems = [];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const rel = page.slice(DIST.length + 1).split('\\').join('/');

  const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  const srcs = [...html.matchAll(/src="(\/[^"]*)"/g)].map((m) => m[1]);

  for (const url of new Set([...hrefs, ...srcs])) {
    // in-page anchors and the root are always fine
    if (url === '/' || url.startsWith('/#')) continue;
    if (!resolves(url)) problems.push({ page: rel, url });
  }
}

if (problems.length) {
  console.error(`\n  ${problems.length} unresolved reference(s):\n`);
  const byUrl = new Map();
  for (const p of problems) {
    if (!byUrl.has(p.url)) byUrl.set(p.url, []);
    byUrl.get(p.url).push(p.page);
  }
  for (const [url, onPages] of byUrl) {
    console.error(`    ${url}`);
    console.error(`      on ${onPages.length} page(s), e.g. ${onPages[0]}`);
  }
  console.error('');
  process.exit(1);
}

console.log(`  ok — every internal link and asset reference across ${pages.length} pages resolves`);
