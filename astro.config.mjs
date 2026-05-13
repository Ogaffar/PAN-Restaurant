// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://panfayetteville.com',
  adapter: cloudflare(),

  integrations: [
    sitemap({
      // /catering is server-rendered (prerender=false) so it won't be auto-discovered
      customPages: ['https://panfayetteville.com/catering/'],
      // Exclude transactional/utility pages — they carry noindex anyway
      filter: page =>
        !page.includes('/subscribe/') &&
        !page.includes('/catering/thanks') &&
        !page.includes('/style-guide'),
    }),
    mdx(),
    icon({
      include: {
        mdi: ['*'],
        lucide: ['*'],
        'simple-icons': ['instagram', 'facebook'],
      },
    }),
  ],

  image: {
    domains: ['panfayetteville.com'],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
