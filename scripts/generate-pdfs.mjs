import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:4321';
const OUTPUT_DIR = join(process.cwd(), 'preview');

const pages = [
  { route: '/',                  name: 'index' },
  { route: '/about',             name: 'about' },
  { route: '/benefits',          name: 'benefits' },
  { route: '/careers',           name: 'careers' },
  { route: '/contact',           name: 'contact' },
  { route: '/faq',               name: 'faq' },
  { route: '/news',              name: 'news' },
  { route: '/portfolio',         name: 'portfolio' },
  { route: '/videos',            name: 'videos' },
  { route: '/why-liveroof',      name: 'why-liveroof' },
  { route: '/products',          name: 'products' },
  { route: '/technical',         name: 'technical' },
];

mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

for (const { route, name } of pages) {
  const url = `${BASE_URL}${route}`;
  console.log(`Generating ${name}.pdf ...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.pdf({
    path: join(OUTPUT_DIR, `${name}.pdf`),
    format: 'A4',
    printBackground: true,
  });
}

await browser.close();
console.log(`\nDone! PDFs saved to: preview/`);
