import { defineConfig } from 'astro/config';

const rawBase = process.env.SITE_BASE || '/';
const normalizedBase = rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;

export default defineConfig({
  site: process.env.SITE_URL || 'https://huangyul.github.io',
  base: normalizedBase,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
