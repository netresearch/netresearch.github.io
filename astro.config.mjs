import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://netresearch.github.io',
  trailingSlash: 'always',
  redirects: {
    // The plan's URL shape uses /en/. English is served from the bare root so
    // the organisation's strongest URL stays canonical, so /en/ forwards there
    // rather than becoming a second, competing English page.
    '/en/': '/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
