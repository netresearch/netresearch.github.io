import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { categorizeRepo, type Category, categories } from './categories';

export interface QualityBadge {
  type: string;
  alt: string;
  url: string;
}

export interface FeaturedProject {
  name: string;
  repo: string;
  category: string;
  description: string;
  links?: { type: string; url: string; label: string }[];
  url?: string;
  stars?: number;
  language?: string;
  pushed_at?: string;
  latestRelease?: string;
  qualityBadges?: QualityBadge[];
}

/** Raw repo shape from github-repos.json (before categorization) */
interface RawRepo {
  name: string;
  description: string;
  url: string;
  language: string | null;
  topics: string[];
  stars: number;
  pushed_at: string;
  latestRelease?: string;
  qualityBadges?: QualityBadge[];
}

export interface RepoProject extends RawRepo {
  category: string;
}

export interface ProjectData {
  featured: FeaturedProject[];
  byCategory: Record<string, RepoProject[]>;
  categories: Category[];
  stats: { totalRepos: number; totalStars: number; languages: number };
}

export function loadProjects(): ProjectData {
  const featuredRaw = readFileSync(
    join(process.cwd(), 'src/data/featured.yaml'),
    'utf-8',
  );
  const featured = yaml.load(featuredRaw) as FeaturedProject[];

  let rawRepos: RawRepo[] = [];
  try {
    const reposRaw = readFileSync(
      join(process.cwd(), 'src/data/github-repos.json'),
      'utf-8',
    );
    rawRepos = JSON.parse(reposRaw);
  } catch {
    console.warn('github-repos.json not found — run: npm run fetch-repos');
  }

  const featuredNames = new Set(featured.map((f) => f.repo.split('/')[1]));
  for (const feat of featured) {
    const repoName = feat.repo.split('/')[1];
    const ghData = rawRepos.find((r) => r.name === repoName);
    if (ghData) {
      feat.url = ghData.url;
      feat.stars = ghData.stars;
      feat.language = ghData.language;
      feat.pushed_at = ghData.pushed_at;
      feat.latestRelease = ghData.latestRelease;
      if (ghData.qualityBadges) {
        feat.qualityBadges = ghData.qualityBadges;
      }
    }
  }

  const nonFeatured: RepoProject[] = rawRepos
    .filter((r) => !featuredNames.has(r.name))
    .map((r) => ({
      ...r,
      category: categorizeRepo(r.topics || [], r.language, r.name),
    }))
    .sort((a, b) => b.stars - a.stars);

  const byCategory: Record<string, RepoProject[]> = {};
  for (const cat of categories) {
    byCategory[cat.id] = nonFeatured.filter((r) => r.category === cat.id);
  }

  const allLanguages = new Set(rawRepos.map((r) => r.language).filter(Boolean));
  const totalStars = rawRepos.reduce((sum, r) => sum + (r.stars || 0), 0);

  return {
    featured,
    byCategory,
    categories,
    stats: {
      totalRepos: rawRepos.length,
      totalStars,
      languages: allLanguages.size,
    },
  };
}
