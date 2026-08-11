/**
 * Build gate for the published site.
 *
 * Runs against dist/ after `astro build`, so it checks what visitors and
 * crawlers actually receive rather than what the source intends. Every rule
 * here exists because its absence produced a real defect: metrics rendered as
 * zero, versions that contradicted their own repository, review dates that
 * silently aged, and CTAs pointing nowhere.
 *
 * Exit code 1 fails the build. Warnings are printed but do not fail.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const errors = [];
const warnings = [];

const fail = (file, message) => errors.push(`${file}: ${message}`);
const warn = (file, message) => warnings.push(`${file}: ${message}`);

/** Every .html file in dist/, relative to dist/. */
function htmlFiles(dir = DIST) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return full.endsWith('.html') ? [full] : [];
  });
}

/**
 * Text content only — strips script, style and all tags.
 *
 * `data-figure` elements are dropped as well: those hold locale-formatted
 * measurements (German groups thousands with dots, so 7.254.283 downloads reads
 * exactly like a version number) and they come from the impact snapshot, not
 * from hand-written copy.
 */
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, ' ')
    .replace(/<(\w+)[^>]*\sdata-figure=[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * The head values this gate reads, as literal patterns.
 *
 * These were built with `new RegExp` from arguments. Every call site passed a
 * literal, but a helper that compiles a pattern out of its parameters is one
 * refactor away from compiling one out of page content — so the patterns live
 * here instead.
 */
const HEAD_VALUE = {
  description: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
  canonical: /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i,
  ogImage: /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i,
  twitterCard: /<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i,
};

function headValue(html, key) {
  return html.match(HEAD_VALUE[key])?.[1] ?? null;
}

// ── Preconditions ────────────────────────────────────────────────────────────

if (!existsSync(DIST)) {
  console.error('verify-site: dist/ not found — run `astro build` first.');
  process.exit(1);
}

const projects = JSON.parse(readFileSync(join(ROOT, 'src/data/projects.json'), 'utf-8'));
const impact = JSON.parse(readFileSync(join(ROOT, 'src/data/impact.json'), 'utf-8'));
const siteSource = readFileSync(join(ROOT, 'src/data/site.ts'), 'utf-8');
const lastVerified = siteSource.match(/lastVerified: '([\d-]+)'/)?.[1];
const maxAgeDays = Number(siteSource.match(/MAX_VERIFIED_AGE_DAYS = (\d+)/)?.[1] ?? 180);

// ── Truth: review date ───────────────────────────────────────────────────────

if (!lastVerified) {
  fail('src/data/site.ts', 'lastVerified is missing');
} else {
  const ageDays = Math.floor((Date.now() - Date.parse(lastVerified)) / 86_400_000);
  if (ageDays > maxAgeDays) {
    fail(
      'src/data/site.ts',
      `lastVerified is ${ageDays} days old, over the ${maxAgeDays}-day limit — review the copy or move the date deliberately`,
    );
  }
}

// ── Truth: manifests ─────────────────────────────────────────────────────────

for (const product of projects.products) {
  if (!product.stage) fail(`projects.json:${product.id}`, 'no maturity stage');
  if (!product.main_version && !product.latest_release) {
    fail(`projects.json:${product.id}`, 'neither a release nor a main-branch version');
  }
  if (product.manifest_source === 'derived') {
    warn(
      `projects.json:${product.id}`,
      'running on derived data — the product repository does not publish project-manifest.json yet',
    );
  }
  if (product.manifest_source === 'published' && !product.last_verified) {
    fail(`projects.json:${product.id}`, 'published manifest without last_verified');
  }
  if (product.manifest_source === 'published' && !product.owner) {
    fail(`projects.json:${product.id}`, 'published manifest without an owner');
  }
}

// ── Truth: impact snapshot freshness ─────────────────────────────────────────

const impactAgeDays = Math.floor((Date.now() - Date.parse(impact.generated_at)) / 86_400_000);
if (impactAgeDays > 14) {
  fail(
    'src/data/impact.json',
    `snapshot is ${impactAgeDays} days old — the dashboard run or the fetch is broken`,
  );
}

// ── Rendered output ──────────────────────────────────────────────────────────

const pages = htmlFiles();
if (pages.length === 0) fail('dist/', 'no HTML pages were built');

/**
 * Every version the build derived from a source of truth: the product manifests
 * and the fetched repository metadata. A version string on a page that is not in
 * this set was typed by hand, and a hand-typed version is exactly what drifts.
 */
const repoReleases = existsSync(join(ROOT, 'src/data/github-repos.json'))
  ? JSON.parse(readFileSync(join(ROOT, 'src/data/github-repos.json'), 'utf-8'))
      .map((r) => r.latestRelease)
      .filter(Boolean)
  : [];

const knownVersions = new Set(
  [
    ...projects.products.flatMap((p) => [p.latest_release, p.main_version, p.docs_version]),
    ...repoReleases,
  ]
    .filter(Boolean)
    .flatMap((v) => [v, String(v).replace(/^v/, ''), `v${String(v).replace(/^v/, '')}`]),
);

for (const file of pages) {
  const name = relative(DIST, file);
  const html = readFileSync(file, 'utf-8');
  const text = visibleText(html);

  // Redirect stubs are meta-refresh only and carry no content of their own.
  if (/<meta[^>]+http-equiv=["']refresh["']/i.test(html)) continue;

  // Placeholders. A metric rendered as a bare 0, or a container that says it is
  // still loading, means the fact only exists after JavaScript runs.
  if (/data-count-to=["'][^"']*["'][^>]*>\s*0\s*</.test(html)) {
    fail(name, 'a counter renders as 0 in the initial HTML');
  }
  for (const placeholder of ['Loading…', 'Loading...', 'TBD', 'Lorem ipsum']) {
    if (text.includes(placeholder)) fail(name, `placeholder text in the initial HTML: "${placeholder}"`);
  }

  // Metadata.
  if (!/<title>[^<]+<\/title>/.test(html)) fail(name, 'no title');
  if (!headValue(html, 'description')) fail(name, 'no meta description');
  const canonical = headValue(html, 'canonical');
  if (!canonical) fail(name, 'no canonical URL');
  if (!/hreflang=["']x-default["']/.test(html)) fail(name, 'no x-default hreflang');
  const ogImage = headValue(html, 'ogImage');
  if (!ogImage) {
    fail(name, 'no og:image');
  } else if (ogImage.startsWith('https://netresearch.github.io/')) {
    // A social card that 404s is worse than none: the preview renders blank.
    const local = ogImage.replace('https://netresearch.github.io/', '');
    if (!existsSync(join(DIST, local))) fail(name, `og:image does not exist: ${ogImage}`);
  }
  if (!headValue(html, 'twitterCard')) fail(name, 'no twitter:card');

  // Structured data must parse, and must not be empty boilerplate.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) fail(name, 'no JSON-LD');
  for (const [, raw] of blocks) {
    try {
      const parsed = JSON.parse(raw);
      const nodes = parsed['@graph'] ?? [parsed];
      if (!Array.isArray(nodes) || nodes.length === 0) fail(name, 'empty JSON-LD graph');
      for (const node of nodes) {
        if (!node['@type']) fail(name, 'JSON-LD node without @type');
      }
    } catch (err) {
      fail(name, `invalid JSON-LD: ${err.message}`);
    }
  }

  // Every page offers a business action, and it is tagged.
  const businessCtas = [...html.matchAll(/href="([^"]*netresearch\.de\/kontakt\/[^"]*)"/g)];
  if (businessCtas.length === 0) fail(name, 'no business CTA to the contact form');
  for (const [, href] of businessCtas) {
    for (const param of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      if (!href.includes(`${param}=`)) fail(name, `contact link without ${param}: ${href}`);
    }
  }

  // Brand: the logo appears exactly once, and not below 32px.
  const logos = [...html.matchAll(/<img[^>]+netresearch\.svg[^>]*>/g)];
  if (logos.length !== 1) fail(name, `the logo appears ${logos.length} times, expected exactly once`);
  for (const [tag] of logos) {
    const height = tag.match(/height=["'](\d+)["']/);
    if (height && Number(height[1]) < 32) fail(name, `logo rendered at ${height[1]}px, below the 32px minimum`);
  }

  // Version drift: any version-looking string on the page must be one the
  // manifest knows. Catches a number hand-typed into copy.
  for (const [, version] of text.matchAll(/\bv?(\d+\.\d+\.\d+)\b/g)) {
    if (!knownVersions.has(version) && !knownVersions.has(`v${version}`)) {
      fail(
        name,
        `version ${version} is rendered but comes from no build artefact — hand-typed versions drift`,
      );
    }
  }
}

// ── Internal links resolve ───────────────────────────────────────────────────

const built = new Set(
  htmlFiles().map((f) => `/${relative(DIST, f).replaceAll(/index\.html$/g, '').replaceAll('\\', '/')}`),
);
const assets = new Set(
  (function walk(dir) {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      return statSync(full).isDirectory()
        ? walk(full)
        : [`/${relative(DIST, full).replaceAll('\\', '/')}`];
    });
  })(DIST),
);

for (const file of pages) {
  const name = relative(DIST, file);
  const html = readFileSync(file, 'utf-8');
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
    if (built.has(href) || assets.has(href) || assets.has(`${href}index.html`)) continue;
    fail(name, `internal link does not resolve: ${href}`);
  }
}

// ── Machine-readable endpoints ───────────────────────────────────────────────

for (const required of ['sitemap.xml', 'robots.txt', 'llms.txt', 'projects.json', 'schema/project-manifest.schema.json']) {
  if (!existsSync(join(DIST, required))) fail('dist/', `missing ${required}`);
}

// ── Report ───────────────────────────────────────────────────────────────────

for (const message of warnings) console.warn(`warn  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

console.log(
  `\nverify-site: ${pages.length} pages checked, ${errors.length} errors, ${warnings.length} warnings`,
);
process.exit(errors.length > 0 ? 1 : 0);
