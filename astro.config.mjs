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
    sitemap(),
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
