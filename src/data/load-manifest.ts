import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lang } from '../i18n';

export interface EvidencedClaim {
  id: string;
  label: string;
  detail?: string;
  state?: 'planned' | 'experimental' | 'implemented' | 'measured';
  evidence?: string;
}

export type Stage = 'concept' | 'poc' | 'alpha' | 'beta' | 'stable' | 'maintenance';

export interface Product {
  id: string;
  name: string;
  slug: string;
  stage: Stage;
  latest_release: string | null;
  release_date: string | null;
  main_version: string | null;
  docs_version: string | null;
  last_verified: string | null;
  owner: string | null;
  license: string | null;
  repository: string;
  documentation: string | null;
  demo: string | null;
  support: string;
  typo3_versions?: string[];
  php_versions?: string[];
  capabilities?: EvidencedClaim[];
  security_controls?: EvidencedClaim[];
  cost_controls?: EvidencedClaim[];
  providers?: string[];
  evidence?: { type: string; label?: string; url: string }[];
  /** Portfolio framing owned by the hub, not by the product repo. */
  repo: string;
  page: string;
  stack_layer: string;
  primary: boolean;
  role: Record<Lang, string>;
  summary: Record<Lang, string>;
  suited_for: Record<Lang, string>;
  boundary: Record<Lang, string>;
  manifest_source: 'published' | 'derived';
}

export interface ProjectsFile {
  generated_at: string;
  schema: string;
  products: Product[];
}

/**
 * Aggregated product manifests, produced by scripts/build-manifest.mjs.
 * Run `npm run fetch-data` before building; a missing file is a hard error, not
 * a reason to render an empty stack.
 */
export function loadProducts(): ProjectsFile {
  const raw = readFileSync(join(process.cwd(), 'src/data/projects.json'), 'utf-8');
  return JSON.parse(raw) as ProjectsFile;
}

/** Order the stack is presented in: foundation first, agents last. */
const LAYER_ORDER = ['security-identity', 'control-plane', 'assistance-agents', 'content', 'channels'];

export function orderedProducts(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => LAYER_ORDER.indexOf(a.stack_layer) - LAYER_ORDER.indexOf(b.stack_layer),
  );
}
