import puppeteer from 'puppeteer';
import { createClient } from '@sanity/client';
import { mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.PREVIEW_BASE_URL ?? 'http://localhost:4321';
const OUTPUT_DIR = join(process.cwd(), 'preview');

// Load .env manually (this is a Node script, not Vite/Astro).
try {
  const env = readFileSync('.env', 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env is optional */ }

const staticPages = [
  { route: '/',             name: 'index' },
  { route: '/about',        name: 'about' },
  { route: '/benefits',     name: 'benefits' },
  { route: '/careers',      name: 'careers' },
  { route: '/contact',      name: 'contact' },
  { route: '/faq',          name: 'faq' },
  { route: '/news',         name: 'news' },
  { route: '/portfolio',    name: 'portfolio' },
  { route: '/videos',       name: 'videos' },
  { route: '/why-liveroof', name: 'why-liveroof' },
  { route: '/products',     name: 'products' },
  { route: '/technical',    name: 'technical' },
];

// Fetch portfolio detail slugs from Sanity so we cover dynamic routes too.
async function fetchPortfolioPages() {
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
  if (!projectId) return [];
  const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: true });
  const slugs = await client.fetch(`*[_type == "project" && active != false].slug.current`);
  return slugs.map(slug => ({ route: `/portfolio/${slug}`, name: `portfolio-${slug}` }));
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const portfolioPages = await fetchPortfolioPages();
const pages = [...staticPages, ...portfolioPages];

console.log(`Capturing ${pages.length} pages from ${BASE_URL}`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

for (const { route, name } of pages) {
  const url = `${BASE_URL}${route}`;
  process.stdout.write(`  ${name} ... `);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    // Let fonts, lazy images, and the hero video settle.
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({
      path: join(OUTPUT_DIR, `${name}.png`),
      fullPage: true,
      type: 'png',
    });

    await page.pdf({
      path: join(OUTPUT_DIR, `${name}.pdf`),
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    console.log('ok');
  } catch (err) {
    console.log(`failed (${err.message})`);
  }
}

await browser.close();
console.log(`\nDone. Output: preview/ (${pages.length * 2} files)`);
