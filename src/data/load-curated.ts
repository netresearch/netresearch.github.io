import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// js-yaml 5 dropped the default export; only named exports remain.
import { load as loadYaml } from 'js-yaml';
import type { Lang } from '../i18n';

interface CuratedEntry {
  repo: string;
  facet: string;
  problem: Record<Lang, string>;
}

export interface CuratedProject extends CuratedEntry {
  url: string;
  description: string;
  language: string | null;
  stars: number;
  latestRelease: string | null;
  pushed_at: string | null;
}

interface RawRepo {
  name: string;
  description: string;
  url: string;
  language: string | null;
  stars: number;
  pushed_at: string;
  latestRelease?: string;
}

function readRepos(): RawRepo[] {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), 'src/data/github-repos.json'), 'utf-8'),
    ) as RawRepo[];
  } catch {
    console.warn('github-repos.json not found — run: npm run fetch-repos');
    return [];
  }
}

/**
 * The curated front-page selection, joined with live repository metadata.
 *
 * A curated entry whose repository is missing from the fetched data is dropped
 * rather than rendered with blanks — a card that cannot state its release is a
 * placeholder, and placeholders are what this rebuild removes.
 */
export function loadCurated(): CuratedProject[] {
  const entries = loadYaml(
    readFileSync(join(process.cwd(), 'src/data/curated.yaml'), 'utf-8'),
  ) as CuratedEntry[];
  const repos = readRepos();

  return entries.flatMap((entry) => {
    const repo = repos.find((r) => r.name === entry.repo);
    if (!repo) {
      console.warn(`curated: ${entry.repo} not present in github-repos.json — skipped`);
      return [];
    }
    return [
      {
        ...entry,
        url: repo.url,
        description: repo.description,
        language: repo.language,
        stars: repo.stars,
        latestRelease: repo.latestRelease ?? null,
        pushed_at: repo.pushed_at,
      },
    ];
  });
}
