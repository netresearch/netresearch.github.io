/**
 * Aggregate the per-product manifests into the hub's single source of truth.
 *
 * Each product repository publishes <pages_url>project-manifest.json from its
 * own release data. This script collects them, validates them against
 * schema/project-manifest.schema.json, and writes:
 *
 *   src/data/projects.json   consumed by the Astro build
 *   public/projects.json     published so the other sites can consume it too
 *
 * A product that does not publish a manifest yet is *derived* from the GitHub
 * API plus the fallbacks in src/data/products.yaml, and marked
 * `manifest_source: "derived"`. scripts/verify-site.mjs reports those, so the
 * gap stays visible instead of silently looking like verified truth.
 *
 * Both outputs are build artefacts and are not committed. If this script cannot
 * run, the build fails — that is the point. A page that renders yesterday's
 * truth without saying so is the defect this whole layer exists to remove.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// js-yaml 5 dropped the default export; only named exports remain.
import { load as loadYaml } from 'js-yaml';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PRODUCTS = join(ROOT, 'src', 'data', 'products.yaml');
const SCHEMA = join(ROOT, 'public', 'schema', 'project-manifest.schema.json');
const OUT_DATA = join(ROOT, 'src', 'data', 'projects.json');
const OUT_PUBLIC = join(ROOT, 'public', 'projects.json');

// allErrors stays off: the build only needs to know a manifest failed, and
// collecting every error is a denial-of-service vector on input fetched
// from the network.
const ajv = new Ajv({ allErrors: false, strict: false });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(SCHEMA, 'utf-8')));

/**
 * One GitHub REST call. Returns the parsed body, or null on any failure.
 *
 * This used to shell out to the `gh` binary, which meant the build depended on
 * PATH resolution and on a tool being installed. fetch needs neither.
 */
async function gh(path) {
  const headers = { Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`https://api.github.com/${path}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Every URL a manifest may contribute to the rendered page.
 *
 * The schema declares these as `format: uri`, which ajv accepts loosely enough
 * to let a `javascript:` URI through — and these values are rendered as href
 * attributes. A product repository is trusted to publish its own status, not to
 * publish a link scheme. Anything that is not http(s) is dropped.
 */
const URL_FIELDS = ['repository', 'documentation', 'demo', 'support'];

function safeUrl(value) {
  if (typeof value !== 'string' || value === '') return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}

/** Drop every link a manifest published that is not an http(s) URL. */
function sanitiseLinks(manifest, id) {
  const rejected = [];
  const clean = { ...manifest };

  for (const field of URL_FIELDS) {
    if (clean[field] == null) continue;
    const safe = safeUrl(clean[field]);
    if (!safe) rejected.push(field);
    clean[field] = safe;
  }

  for (const key of ['capabilities', 'security_controls', 'cost_controls']) {
    if (!Array.isArray(clean[key])) continue;
    clean[key] = clean[key].map((claim) => {
      if (claim?.evidence == null) return claim;
      const safe = safeUrl(claim.evidence);
      if (!safe) rejected.push(`${key}[${claim.id}].evidence`);
      return { ...claim, evidence: safe ?? undefined };
    });
  }

  if (Array.isArray(clean.evidence)) {
    clean.evidence = clean.evidence.filter((item) => {
      if (safeUrl(item?.url)) return true;
      rejected.push(`evidence:${item?.type ?? '?'}`);
      return false;
    });
  }

  if (rejected.length) {
    console.warn(`${id}: dropped ${rejected.length} link(s) that were not http(s): ${rejected.join(', ')}`);
  }
  return clean;
}

async function fetchPublishedManifest(pagesUrl) {
  const url = new URL('project-manifest.json', pagesUrl).toString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { manifest: null, reason: `HTTP ${res.status}` };
    return { manifest: await res.json(), reason: null };
  } catch (err) {
    return { manifest: null, reason: err.message };
  }
}

/**
 * Build a manifest from GitHub for a product that does not publish one yet.
 * Only fields GitHub can actually answer are derived; everything editorial
 * comes from the product's stage_fallback in products.yaml.
 */
async function deriveManifest(product) {
  const [, repoName] = product.repo.split('/');

  // A failure here used to produce a manifest with empty fields, which is the
  // exact failure this whole layer exists to prevent: a page that states
  // nothing while looking like it states something. Unauthenticated GitHub
  // requests are rate-limited to 60 an hour, so set GITHUB_TOKEN locally.
  const meta = await gh(`repos/${product.repo}`);
  if (!meta) {
    throw new Error(
      `cannot read repos/${product.repo} from the GitHub API — rate-limited, or GITHUB_TOKEN is unset`,
    );
  }
  const release = (await gh(`repos/${product.repo}/releases/latest`)) ?? {};

  // The tag ends up in the published manifest, on the page and in a URL, so it
  // is validated rather than trusted: anything that is not a plain semantic
  // version tag counts as no release at all.
  const tag = String(release.tag_name ?? '');
  const latestRelease = /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag) ? tag : null;
  const published = String(release.published_at ?? '').slice(0, 10);
  const releaseDate =
    latestRelease && /^\d{4}-\d{2}-\d{2}$/.test(published) ? published : null;
  if (tag && !latestRelease) {
    console.warn(`${product.id}: ignoring release tag that is not a version: ${tag}`);
  }

  let mainVersion = product.main_version_fallback ?? null;
  const contents = await gh(`repos/${product.repo}/contents/ext_emconf.php`);
  if (contents?.content) {
    const decoded = Buffer.from(contents.content, 'base64').toString('utf-8');
    const match = decoded.match(/'version'\s*=>\s*'([^']+)'/);
    if (match) mainVersion = match[1];
  }

  const repository = meta.html_url ?? `https://github.com/${product.repo}`;

  return {
    manifest_version: 1,
    name: repoName.replace(/^t3x-/, ''),
    // A product without a page has no path below netresearch.github.io.
    slug: product.pages_url ? new URL(product.pages_url).pathname : null,
    stage: product.stage_fallback,
    latest_release: latestRelease,
    release_date: releaseDate,
    main_version: mainVersion ?? (latestRelease ?? '').replace(/^v/, '') ?? null,
    docs_version: null,
    // Derived data was never reviewed by a person, so it carries no review date.
    last_verified: null,
    owner: null,
    license: meta.license?.spdx_id ?? null,
    repository,
    documentation: `${repository}#readme`,
    demo: null,
    support: 'https://www.netresearch.de/kontakt/',
    capabilities: [],
    security_controls: [],
    cost_controls: [],
    providers: [],
    evidence: latestRelease
      ? [
          {
            type: 'release',
            label: latestRelease,
            url: `https://github.com/${product.repo}/releases/tag/${latestRelease}`,
          },
        ]
      : [],
  };
}

async function main() {
  const products = loadYaml(readFileSync(PRODUCTS, 'utf-8'));
  const entries = [];
  let derivedCount = 0;

  for (const product of products) {
    let resolved;
    let source;

    if (!product.pages_url) {
      // No product page of its own. The hub is the source for this project, and
      // the page says so — that is a different thing from a project that has a
      // page but has not started publishing a manifest.
      resolved = await deriveManifest(product);
      source = 'repository';
      derivedCount += 1;
    } else {
      const { manifest, reason } = await fetchPublishedManifest(product.pages_url);
      if (manifest && validate(manifest)) {
        resolved = manifest;
        source = 'published';
      } else {
        if (manifest) {
          console.warn(
            `${product.id}: published manifest failed schema validation — ` +
              ajv.errorsText(validate.errors),
          );
        } else {
          console.warn(`${product.id}: has a page but publishes no manifest (${reason}) — deriving`);
        }
        resolved = await deriveManifest(product);
        source = 'derived';
        derivedCount += 1;
      }
    }

    entries.push({
      ...sanitiseLinks(resolved, product.id),
      id: product.id,
      repo: product.repo,
      page: product.page,
      stack_layer: product.stack_layer,
      primary: product.primary === true,
      role: product.role,
      summary: product.summary,
      suited_for: product.suited_for,
      boundary: product.boundary,
      manifest_source: source,
    });
  }

  const output = {
    generated_at: new Date().toISOString(),
    schema: 'https://netresearch.github.io/schema/project-manifest.schema.json',
    products: entries,
  };

  mkdirSync(dirname(OUT_DATA), { recursive: true });
  mkdirSync(dirname(OUT_PUBLIC), { recursive: true });
  const json = JSON.stringify(output, null, 2);
  writeFileSync(OUT_DATA, `${json}\n`);
  writeFileSync(OUT_PUBLIC, `${json}\n`);

  const counts = entries.reduce((acc, e) => ({ ...acc, [e.manifest_source]: (acc[e.manifest_source] ?? 0) + 1 }), {});
  console.log(
    `Wrote ${entries.length} products (` +
      Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ') +
      ')',
  );
}

await main();
