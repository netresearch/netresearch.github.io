/**
 * Runs axe-core against every built page, in a real browser.
 *
 * scripts/check-accessibility.mjs covers what is decidable from markup alone.
 * The defects it cannot see — colour contrast above all, because that needs
 * resolved CSS and a compositing model — are what this file is for. Lighthouse
 * found five contrast failures on the live site that the static checker passed,
 * which is the reason this exists.
 *
 *   node scripts/axe-audit.mjs [dist-dir]
 *
 * Exits non-zero on any violation at the configured conformance level. Serves
 * dist/ over loopback because Astro emits absolute asset paths, which file://
 * cannot resolve — an unstyled page has no contrast failures and would pass for
 * the wrong reason.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

const DIST = process.argv[2] ?? 'dist';

// WCAG 2.1 AA, which is what the pages claim. 'best-practice' is deliberately
// not included: it flags stylistic preferences, and a gate that fails on those
// gets disabled instead of fixed.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Every index.html below dist/, as the URL path a visitor would use. */
function htmlRoutes(dir, base = dir) {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      routes.push(...htmlRoutes(full, base));
    } else if (entry === 'index.html') {
      const path = `/${relative(base, dir)}`.replace(/\/$/, '');
      routes.push(path === '/' || path === '/.' ? '/' : `${path}/`);
    }
  }
  return routes.sort();
}

function serve(root) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = join(root, decodeURIComponent(url.pathname));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/**
 * Both colour schemes. The dark palette is a separate set of colour pairs, so a
 * light-only audit says nothing about it — and the pages ship dark mode.
 */
const SCHEMES = ['light', 'dark'];

async function main() {
  const { server, port } = await serve(DIST);
  const routes = htmlRoutes(DIST);
  if (routes.length === 0) throw new Error(`no pages found in ${DIST} — run the build first`);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const failures = [];
  let checked = 0;

  for (const route of routes) {
    for (const scheme of SCHEMES) {
      const page = await browser.newPage();
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle0' });
      await page.addScriptTag({ path: axePath });

      const results = await page.evaluate(
        async (tags) => await window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
        TAGS,
      );

      checked += 1;
      for (const violation of results.violations) {
        failures.push({ route, scheme, violation });
      }
      await page.close();
    }
  }

  await browser.close();
  server.close();

  for (const { route, scheme, violation } of failures) {
    console.error(`\n✗ ${route} [${scheme}] — ${violation.id} (${violation.impact})`);
    console.error(`  ${violation.help}`);
    console.error(`  ${violation.helpUrl}`);
    for (const node of violation.nodes.slice(0, 4)) {
      console.error(`    ${node.target.join(' ')}`);
      const summary = (node.failureSummary ?? '').split('\n').filter(Boolean).slice(1);
      for (const line of summary) console.error(`      ${line}`);
    }
    if (violation.nodes.length > 4) {
      console.error(`    … and ${violation.nodes.length - 4} more element(s)`);
    }
  }

  if (failures.length) {
    console.error(
      `\naxe: ${failures.length} violation(s) across ${checked} page renders (${routes.length} routes × ${SCHEMES.length} colour schemes)`,
    );
    process.exit(1);
  }

  console.log(
    `axe: no WCAG 2.1 AA violations in ${checked} page renders (${routes.length} routes × ${SCHEMES.length} colour schemes)`,
  );
}

await main();
