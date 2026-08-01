// Re-encode the hero background video and generate a poster frame.
//
// The source is a 5-second 1920x1080 loop at ~12 Mb/s with a stereo audio
// track — 7.36 MB for something that plays muted behind the homepage headline.
// A background loop does not need broadcast bitrate, and the audio track is
// dead weight because the <video> is muted.
//
// Writes alongside the original (media1.optimized.mp4 / media1-poster.jpg) so
// the result can be compared before anything is replaced.
//
// Needs ffmpeg. It is not a dependency of this project — an ~80 MB binary is
// not worth carrying for a script that runs when the hero video changes, which
// is rarely. Use a system ffmpeg, or install one just for the run:
//
//   npx --yes --package ffmpeg-static node scripts/optimize-video.mjs
//
//   node scripts/optimize-video.mjs           # encode next to the original
//   node scripts/optimize-video.mjs --replace # overwrite the original
import { execFileSync } from 'node:child_process';
import { statSync, renameSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/** Prefer ffmpeg-static if it happens to be installed, else fall back to PATH. */
function resolveFfmpeg() {
  try {
    return createRequire(import.meta.url)('ffmpeg-static');
  } catch {
    // `ffmpeg` on PATH; execFileSync throws a clear ENOENT if it is absent.
    return 'ffmpeg';
  }
}

const ffmpeg = resolveFfmpeg();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public', 'images', 'media1.mp4');
const OUT = join(ROOT, 'public', 'images', 'media1.optimized.mp4');
const POSTER = join(ROOT, 'public', 'images', 'media1-poster.jpg');

const REPLACE = process.argv.includes('--replace');
const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(2);

if (!existsSync(SRC)) {
  console.error(`  source not found: ${SRC}`);
  process.exit(1);
}

try {
  execFileSync(ffmpeg, ['-version'], { stdio: 'ignore' });
} catch {
  console.error(
    '  ffmpeg not found.\n' +
      '  Install it system-wide, or run this script with a throwaway copy:\n' +
      '    npx --yes --package ffmpeg-static node scripts/optimize-video.mjs',
  );
  process.exit(1);
}

const before = mb(SRC);
console.log(`  source: ${before} MB`);

// 720p / CRF 32 / 24fps. Measured alternatives on this clip (waving foliage is
// worst-case for compression, so bitrate alone barely helps):
//   1080p CRF30 30fps -> 5.89 MB (-20%)
//   720p  CRF30 30fps -> 2.74 MB (-63%)
//   720p  CRF32 24fps -> 1.83 MB (-75%)   <- chosen
//   960w  CRF32 24fps -> 0.97 MB (-87%)   visibly soft on large displays
// The clip is full-bleed but sits under a dark gradient with the headline over
// it, so 720p upscales acceptably while 960w does not. -an drops the audio
// track, which is dead weight on a muted element. faststart moves the moov
// atom to the front so playback can start before the download finishes.
execFileSync(
  ffmpeg,
  [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', SRC,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '32',
    '-r', '24',
    '-vf', 'scale=1280:-2',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    OUT,
  ],
  { stdio: 'inherit' },
);

// Poster: first frame, so the hero paints immediately instead of a blank box
// while the video loads. Matched to the encoded width and kept light — it is
// only visible for a moment, and it sits under the same dark overlay.
execFileSync(
  ffmpeg,
  [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', SRC,
    '-frames:v', '1',
    '-vf', 'scale=1280:-2',
    '-q:v', '7',
    POSTER,
  ],
  { stdio: 'inherit' },
);

const after = mb(OUT);
const saved = (100 * (1 - statSync(OUT).size / statSync(SRC).size)).toFixed(0);
console.log(`  encoded: ${after} MB  (-${saved}%)`);
console.log(`  poster:  ${mb(POSTER)} MB`);

if (REPLACE) {
  renameSync(OUT, SRC);
  console.log('  replaced the original');
} else {
  console.log('  wrote alongside the original; re-run with --replace to swap it in');
}
