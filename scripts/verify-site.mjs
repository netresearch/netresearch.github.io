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
import { attrs, checkAccessibility } from './check-accessibility.mjs';

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

/** Decode the HTML attribute escapes emitted by our templates, once. */
function decodedAttribute(value = '') {
  const named = { amp: '&', AMP: '&', quot: '"', QUOT: '"', apos: "'", lt: '<', LT: '<', gt: '>', GT: '>' };
  return value.replace(/&(#(?:[xX][\dA-Fa-f]+|\d+)|amp|AMP|quot|QUOT|apos|lt|LT|gt|GT);/g, (_, entity) => {
    if (entity in named) return named[entity];
    const hexadecimal = entity[1] === 'x' || entity[1] === 'X';
    const code = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code) : '\ufffd';
  });
}

/** Inspect business actions themselves, including header actions without data-cta. */
function businessAnchors(html) {
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  return [...markup.matchAll(/<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)]
    .map(([tag]) => attrs(tag))
    .filter((anchor) => decodedAttribute(anchor['data-cta']) === 'business'
      || decodedAttribute(anchor.class).split(/\s+/).some((name) => name === 'nr-shell-contact' || name === 'nr-shell-menu-contact'));
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
      'has a product page but publishes no project-manifest.json — the page shows repository-derived data',
    );
  }
  if (!['published', 'derived', 'repository'].includes(product.manifest_source)) {
    fail(`projects.json:${product.id}`, `unknown manifest_source ${product.manifest_source}`);
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
  const lang = html.match(/<html\b[^>]*\blang=["'](en|de)["']/i)?.[1];
  const isNotFound = name === '404.html';

  if (isNotFound) {
    if (!/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/.test(html)) fail(name, 'error document must be noindex');
    if (headValue(html, 'canonical')) fail(name, 'error document must not canonicalise to a regular page');
    if (/<link[^>]*rel=["']alternate["'][^>]*hreflang=/.test(html)) fail(name, 'error document must not declare home pages as language alternates');
    if (/<meta[^>]+http-equiv=["']refresh["']/i.test(html)) fail(name, 'error document must offer recovery without redirecting');
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    for (const home of ['/', '/de/']) {
      if (!main.includes(`href="${home}"`)) fail(name, `error document is missing a home recovery link: ${home}`);
    }
    if (!/<section[^>]*\blang="de"/.test(main)) fail(name, 'German recovery copy must declare its language');
  }

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
  if (!isNotFound && !canonical) fail(name, 'no canonical URL');
  if (!isNotFound && !/hreflang=["']x-default["']/.test(html)) fail(name, 'no x-default hreflang');
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
  if (!isNotFound && blocks.length === 0) fail(name, 'no JSON-LD');
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
  const businessCtas = businessAnchors(html);
  if (businessCtas.length === 0) fail(name, 'no business CTA to the contact form');
  for (const anchor of businessCtas) {
    const href = decodedAttribute(anchor.href);
    let target;
    try {
      target = new URL(href);
    } catch {
      fail(name, 'business CTA requires a valid absolute contact URL');
      continue;
    }
    if (target.protocol !== 'https:' || target.origin !== 'https://www.netresearch.de') {
      fail(name, `business CTA points outside the official HTTPS contact origin: ${href}`);
    }
    const contactPath = lang === 'de' ? '/kontakt/' : '/en/contact/';
    if (target.pathname !== contactPath) fail(name, `contact link changes the selected language: ${href}`);
    for (const param of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      if (!target.searchParams.get(param)?.trim()) fail(name, `contact link without ${param}: ${href}`);
    }
  }

  // Published language pairs keep the selected language across site boundaries.
  for (const legalPath of lang === 'de' ? ['/impressum/', '/datenschutz/'] : ['/en/imprint/', '/en/privacy-policy/']) {
    if (!html.includes(`href="https://www.netresearch.de${legalPath}"`)) fail(name, `missing localised legal link: ${legalPath}`);
  }

  if (name === 'index.html' || name === 'de/index.html') {
    const impactPath = lang === 'de' ? '/maint/de/' : '/maint/';
    const impactSection = html.match(/<section\b[^>]*\bid="impact"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
    if (!impactSection.includes(`href="https://netresearch.github.io${impactPath}"`)) fail(name, 'impact source link does not preserve the selected language');
  }

  const publishedSites = html.match(/<section\b[^>]*\bid="published-sites"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  if (publishedSites) {
    const languagePaths = {
      '/modularer-ki-stack-page/': { en: 'en/', de: '' },
      '/maint/': { en: '', de: 'de/' },
      '/t3x-nr-browser-ai/': { en: '', de: 'de/' },
      '/t3x-nr-mcp-agent/': { en: '', de: 'de/' },
      '/t3x-nr-llm/': { en: 'en/', de: 'de/' },
      '/claude-code-marketplace/': { en: 'en/', de: 'de/' },
    };
    for (const [, href] of publishedSites.matchAll(/href="(https:\/\/netresearch\.github\.io\/[^"]*)"/g)) {
      const actualPath = new URL(href).pathname;
      for (const [basePath, suffix] of Object.entries(languagePaths)) {
        if (!actualPath.startsWith(basePath)) continue;
        const detailPath = actualPath.slice(basePath.length);
        const wrongLanguage = suffix[lang]
          ? !detailPath.startsWith(suffix[lang])
          : /^(?:en|de)\//.test(detailPath);
        if (wrongLanguage) fail(name, `published site link changes the selected language: ${href}`);
      }
    }
  }

  // Brand: the logo appears exactly once, and not below 32px.
  const logos = [...html.matchAll(/<img[^>]+netresearch(?:-symbol-only)?\.svg[^>]*>/g)];
  if (logos.length !== 1) fail(name, `the logo appears ${logos.length} times, expected exactly once`);
  for (const [tag] of logos) {
    const height = tag.match(/height=["'](\d+)["']/);
    if (height && Number(height[1]) < 32) fail(name, `logo rendered at ${height[1]}px, below the 32px minimum`);
  }
  if (!/<header\b[^>]*\bdata-nr-shell\b/.test(html)) fail(name, 'shared standalone header missing');
  if (!/<a[^>]+href="https:\/\/www\.netresearch\.de\/"[^>]*>\s*<img[^>]+netresearch-symbol-only\.svg/.test(html)) {
    fail(name, 'header symbol must link to the company website');
  }
  if (!html.includes('/assets/site-shell/site-shell.css') || !html.includes('/assets/site-shell/site-shell.js')) {
    fail(name, 'shared standalone header assets missing');
  }
  if (/<select[^>]+data-theme-control/.test(html)) fail(name, 'legacy theme select still rendered');

  // Accessibility and semantics decidable from the markup alone.
  for (const problem of checkAccessibility(html)) fail(name, problem);

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

// ── Portfolio facets ─────────────────────────────────────────────────────────
//
// A project whose facet has no label in one language renders no filter button
// there, so the project is reachable only through "All" — invisible, with no
// error anywhere. That happened once; this is why it cannot happen silently.

{
  const curatedFacets = new Set(
    [...readFileSync('src/data/curated.yaml', 'utf-8').matchAll(/^[ \t]*facet:[ \t]*(\S{1,64})/gm)].map(
      (m) => m[1],
    ),
  );
  const content = readFileSync('src/i18n/content.ts', 'utf-8');
  const facetBlocks = [...content.matchAll(/facets:\s*\[([\s\S]*?)\]/g)];
  if (facetBlocks.length !== 2) {
    fail('content.ts', `expected one facet list per language, found ${facetBlocks.length}`);
  }
  facetBlocks.forEach((block, index) => {
    const declared = new Set([...block[1].matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]));
    for (const facet of curatedFacets) {
      if (!declared.has(facet)) {
        fail('content.ts', `facet '${facet}' is used in curated.yaml but has no label in language block ${index + 1}`);
      }
    }
  });
}

// ── Machine-readable endpoints ───────────────────────────────────────────────

for (const required of ['404.html', 'sitemap.xml', 'robots.txt', 'llms.txt', 'projects.json', 'schema/project-manifest.schema.json']) {
  if (!existsSync(join(DIST, required))) fail('dist/', `missing ${required}`);
}

// llms.txt is a Markdown format, not a plain list of URLs. A reader that parses
// it looks for an H1 and for Markdown links; bare URLs leave it with nothing to
// follow, which is what Lighthouse's agentic-browsing audit reported.
if (existsSync(join(DIST, 'llms.txt'))) {
  const llms = readFileSync(join(DIST, 'llms.txt'), 'utf-8');
  if (!/^# \S/m.test(llms)) fail('llms.txt', 'no H1 heading');
  if (!/^> /m.test(llms)) fail('llms.txt', 'no blockquote summary after the H1');
  const links = llms.match(/\[[^\]\n]{1,200}\]\(https?:\/\/[^)\s]{1,500}\)/g) ?? [];
  if (links.length < 5) {
    fail('llms.txt', `only ${links.length} Markdown link(s) — bare URLs do not count`);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

for (const message of warnings) console.warn(`warn  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

console.log(
  `\nverify-site: ${pages.length} pages checked, ${errors.length} errors, ${warnings.length} warnings`,
);
process.exit(errors.length > 0 ? 1 : 0);
