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
  const meta = (await gh(`repos/${product.repo}`)) ?? {};
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

  return {
    manifest_version: 1,
    name: repoName.replace(/^t3x-/, ''),
    slug: new URL(product.pages_url).pathname,
    stage: product.stage_fallback,
    latest_release: latestRelease,
    release_date: releaseDate,
    main_version: mainVersion ?? (latestRelease ?? '').replace(/^v/, '') ?? null,
    docs_version: null,
    // Derived data was never reviewed by a person, so it carries no review date.
    last_verified: null,
    owner: null,
    license: meta.license?.spdx_id ?? null,
    repository: meta.html_url ?? `https://github.com/${product.repo}`,
    documentation: null,
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
    const { manifest, reason } = await fetchPublishedManifest(product.pages_url);

    let resolved;
    let source;
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
        console.warn(`${product.id}: no published manifest (${reason}) — deriving`);
      }
      resolved = await deriveManifest(product);
      source = 'derived';
      derivedCount += 1;
    }

    entries.push({
      ...resolved,
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

  console.log(
    `Wrote ${entries.length} products (${entries.length - derivedCount} published, ${derivedCount} derived)`,
  );
}

await main();
