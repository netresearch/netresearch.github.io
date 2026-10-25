import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lang } from '../i18n';

/** Only localise published language pairs we maintain and have verified. */
const LOCALIZED_PAGES: Record<string, Record<Lang, string>> = {
  'https://netresearch.github.io/': { en: '', de: 'de/' },
  'https://netresearch.github.io/modularer-ki-stack-page/': { en: 'en/', de: '' },
  'https://netresearch.github.io/maint/': { en: '', de: 'de/' },
  'https://netresearch.github.io/t3x-nr-browser-ai/': { en: '', de: 'de/' },
  'https://netresearch.github.io/t3x-nr-mcp-agent/': { en: '', de: 'de/' },
  'https://netresearch.github.io/t3x-nr-llm/': { en: 'en/', de: 'de/' },
  'https://netresearch.github.io/claude-code-marketplace/': { en: 'en/', de: 'de/' },
};

export function publishedPageUrl(url: string, lang: Lang): string {
  const paths = LOCALIZED_PAGES[url];
  if (paths) return `${url}${paths[lang]}`;
  for (const [base, locales] of Object.entries(LOCALIZED_PAGES)) {
    if (Object.values(locales).some((suffix) => url === base + suffix)) return base + locales[lang];
  }
  // The marketplace enforces an EN/DE pair for every published skill detail.
  // Keep its slug and any query/fragment; do not infer routes for other sites.
  const skillDetail = /^(https:\/\/netresearch\.github\.io\/claude-code-marketplace\/)(?:en|de)(\/skills\/[a-z0-9-]+\/(?:[?#].*)?)$/.exec(url);
  return skillDetail ? `${skillDetail[1]}${lang}${skillDetail[2]}` : url;
}

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
