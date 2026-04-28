import { createClient } from '@sanity/client';

const PROJECT_ID = '8gi1g2j6';
const DATASET = 'production';
const API_VERSION = '2024-01-01';
const SOURCE = 'https://liveroof.com/wp-admin/admin-ajax.php';

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_WRITE_TOKEN. Create a token at manage.sanity.io (Editor role) and run:');
  console.error('  node --env-file=.env scripts/seed-projects.mjs');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

const showcaseMap = {
  'Commercial': 'commercial',
  'Educational': 'educational',
  'Healthcare': 'healthcare',
  'Other Institutional': 'other-institutional',
  'Public': 'public',
  'Residential': 'residential',
};

const moduleMap = {
  'LiveRoof® Deep System': 'deep',
  'LiveRoof® Lite System': 'lite',
  'LiveRoof® Maxx System': 'maxx',
  'LiveRoof® Standard System': 'standard',
};

const optionMap = {
  'Multiple Plant Mixes in Design': 'multiple-plant-mixes',
  'Organic Shaped Design': 'organic-shape',
  'RoofStone Pavers on Project': 'roofstone-pavers',
  'Sloped Roof': 'sloped-roof',
};

const leedMap = {
  'LEED Certified': 'certified',
  'LEED Silver': 'silver',
  'LEED Gold': 'gold',
  'LEED Platinum': 'platinum',
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function parseDate(raw) {
  if (!raw) return undefined;
  const s = String(raw).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // MMDDYYYY
  if (/^\d{8}$/.test(s)) {
    const mm = s.slice(0, 2), dd = s.slice(2, 4), yyyy = s.slice(4, 8);
    return `${yyyy}-${mm}-${dd}`;
  }
  // MM/DD/YY
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (m1) {
    const yyyy = Number(m1[3]) < 50 ? `20${m1[3]}` : `19${m1[3]}`;
    return `${yyyy}-${m1[1]}-${m1[2]}`;
  }
  // "Month DD, YYYY"
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return undefined;
}

function sqftToSqm(sqft) {
  const n = Number(sqft);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n / 10.7639);
}

function stripHtml(s) {
  if (!s) return undefined;
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || undefined;
}

function mapProject(p) {
  const title = p.title;
  const slug = slugify(title);
  const terms = p.terms ?? {};
  const meta = p.meta ?? {};

  const options = (terms.mgaf_options ?? [])
    .map((o) => optionMap[o])
    .filter(Boolean);

  return {
    _id: `project-${slug}`,
    _type: 'project',
    name: title,
    slug: { _type: 'slug', current: slug },
    description: stripHtml(p.content),
    city: meta.mg_img_gallery_city?.[0],
    projectSize: sqftToSqm(meta.mgaf_size?.[0]),
    installationDate: parseDate(meta.mg_img_gallery_dateinstalled?.[0]),
    grower: terms.mgaf_grower?.[0],
    province: 'ON',
    showcaseType: showcaseMap[terms.mgaf_type?.[0]],
    moduleType: moduleMap[terms.mgaf_module_type?.[0]],
    options: options.length ? options : undefined,
    leedCertified: leedMap[terms.mgaf_leed?.[0]],
    publicAccess: terms.mgaf_public_access?.[0] === 'Yes',
    active: true,
    retrofit: terms.mgaf_existing?.[0] === 'Yes',
    roofBlue: terms.mgaf_roofblue?.[0] === 'Yes',
    solaGreen: terms.mgaf_solagreen?.[0] === 'Yes',
  };
}

async function main() {
  console.log(`Fetching projects from ${SOURCE} ...`);
  const res = await fetch(SOURCE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'action=liveroof_nmg_items',
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const all = await res.json();

  const ontario = all.filter(
    (p) =>
      p.terms?.mgaf_country?.includes('Canada') &&
      p.terms?.mgaf_state?.includes('Ontario'),
  );
  console.log(`Found ${ontario.length} Ontario projects.`);

  const docs = ontario.map(mapProject);

  if (dryRun) {
    console.log('--dry-run: first 3 mapped docs:');
    console.log(JSON.stringify(docs.slice(0, 3), null, 2));
    console.log(`Would create ${docs.length} documents.`);
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    try {
      const result = await client.createIfNotExists(doc);
      if (result._createdAt === result._updatedAt) {
        created++;
        process.stdout.write(`  + ${doc.name}\n`);
      } else {
        skipped++;
        process.stdout.write(`  = ${doc.name} (already exists)\n`);
      }
    } catch (err) {
      failed++;
      console.error(`  ! ${doc.name}: ${err.message}`);
    }
  }

  console.log(`\nDone. Created: ${created}, already existed: ${skipped}, failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
