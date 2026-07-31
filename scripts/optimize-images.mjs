// Resize + re-encode everything in public/images in place.
//
// Source photos come off the camera at 5000-6000px and 8-15 MB each, which is
// what they were being served at — nothing in public/ passes through Astro's
// image pipeline. This caps the long edge at MAX_EDGE and re-encodes with sane
// quality settings.
//
// Deliberately keeps each file's original extension so that every existing
// <img src="/images/foo.jpg"> keeps resolving. Originals are recoverable from
// git history.
//
//   node scripts/optimize-images.mjs          # write changes
//   node scripts/optimize-images.mjs --dry    # report only
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES_DIR = join(ROOT, 'public', 'images');

// 2400px covers a full-bleed hero on a 1200px container at 2x DPR.
const MAX_EDGE = 2400;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 85;
const WEBP_QUALITY = 82;

const DRY_RUN = process.argv.includes('--dry');
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (EXTENSIONS.has(extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function encoderFor(ext, pipeline) {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true });
    case '.png':
      return pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 9 });
    case '.webp':
      return pipeline.webp({ quality: WEBP_QUALITY, effort: 6 });
    default:
      throw new Error(`unhandled extension: ${ext}`);
  }
}

const kb = (bytes) => Math.round(bytes / 1024);

let totalBefore = 0;
let totalAfter = 0;
let changed = 0;

const files = (await walk(IMAGES_DIR)).sort();

for (const file of files) {
  const ext = extname(file).toLowerCase();

  // Read the whole file up front and hand sharp a buffer. Pointing sharp at a
  // path leaves a handle open on it, which then collides with writing the
  // result back to that same path on Windows/OneDrive.
  const input = await readFile(file);
  const before = input.byteLength;
  totalBefore += before;

  const meta = await sharp(input).metadata();
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);

  let pipeline = sharp(input, { failOn: 'none' }).rotate(); // honour EXIF orientation
  if (longEdge > MAX_EDGE) {
    pipeline = pipeline.resize({
      width: meta.width >= meta.height ? MAX_EDGE : undefined,
      height: meta.height > meta.width ? MAX_EDGE : undefined,
      withoutEnlargement: true,
    });
  }

  // Encode to a buffer and overwrite in place. Writing a .tmp then renaming
  // is the usual safe pattern, but OneDrive holds a lock on synced files and
  // fails the rename with EPERM; an in-place write of an already-buffered
  // result avoids that and never leaves a half-written file from the encoder.
  const output = await encoderFor(ext, pipeline).toBuffer();
  const after = output.byteLength;

  // Never regress: keep the original if re-encoding made it bigger. This also
  // makes the script idempotent — a second run is a no-op.
  if (after >= before) {
    totalAfter += before;
    continue;
  }

  const rel = file.slice(IMAGES_DIR.length + 1);
  const pct = Math.round((1 - after / before) * 100);
  console.log(
    `${rel.padEnd(52)} ${String(kb(before)).padStart(7)} KB -> ${String(kb(after)).padStart(6)} KB  (-${pct}%)  ${longEdge}px -> ${Math.min(longEdge, MAX_EDGE)}px`,
  );

  if (DRY_RUN) {
    totalAfter += after;
    continue;
  }

  await writeFile(file, output);
  totalAfter += after;
  changed += 1;
}

console.log(
  `\n${DRY_RUN ? '[dry run] ' : ''}${changed || files.length} of ${files.length} files` +
    `  ${(totalBefore / 1024 / 1024).toFixed(1)} MB -> ${(totalAfter / 1024 / 1024).toFixed(1)} MB` +
    `  (-${Math.round((1 - totalAfter / totalBefore) * 100)}%)`,
);
