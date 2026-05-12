// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://panfayetteville.com',

  integrations: [
    sitemap(),
    mdx(),
    icon({
      include: {
        mdi: ['*'],
        lucide: ['*'],
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
