import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://netresearch.github.io',
  vite: {
    plugins: [tailwindcss()],
  },
});
