import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface LivePage {
  name: string;
  description: string;
  /** Canonical published URL (custom domain or netresearch.github.io path). */
  url: string;
  /** Source repository URL. */
  repoUrl: string;
  pushed_at: string;
  /** Custom domain, when configured. */
  cname?: string;
}

/**
 * Load the GitHub Pages sites published across the organisation.
 * Data is produced at build time by scripts/fetch-repos.mjs.
 */
export function loadPages(): LivePage[] {
  try {
    const raw = readFileSync(
      join(process.cwd(), 'src/data/github-pages.json'),
      'utf-8',
    );
    return JSON.parse(raw) as LivePage[];
  } catch {
    console.warn('github-pages.json not found — run: npm run fetch-repos');
    return [];
  }
}
