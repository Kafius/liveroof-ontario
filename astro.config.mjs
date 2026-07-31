import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Required for canonical URLs, og:url and sitemap generation.
  site: 'https://www.liveroofontario.ca',
  integrations: [tailwind(), sitemap()],
});
