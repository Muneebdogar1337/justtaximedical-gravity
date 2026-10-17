import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://justtaximedicals.co.uk',
  output: 'static',
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),
  build: {
    format: 'file',
  },
});
