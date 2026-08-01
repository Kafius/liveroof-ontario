import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Required for canonical URLs, og:url and sitemap generation.
  site: 'https://www.liveroofontario.ca',
  integrations: [tailwind(), sitemap()],
  vite: {
    build: {
      // Emit every bundled script as its own file instead of inlining small
      // ones into the HTML. That lets the CSP in vercel.json use a plain
      // script-src 'self' — with inlining on, each page carried inline
      // <script type="module"> blocks that would have needed per-build sha256
      // hashes, which go stale silently the moment a script changes.
      assetsInlineLimit: 0,
    },
  },
});
