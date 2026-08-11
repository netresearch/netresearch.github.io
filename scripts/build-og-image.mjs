/**
 * Render the social preview images.
 *
 * One card per language, so a shared link shows the headline in the language of
 * the page that was shared. Built from the same copy the page renders — the
 * card cannot say something the page does not.
 *
 * Output is committed: it changes only when the headline changes, and Pages
 * needs the file to exist for og:image to resolve.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'img');

/** Pull the headlines out of the content module rather than restating them. */
function headlines() {
  const source = readFileSync(join(ROOT, 'src/i18n/content.ts'), 'utf-8');
  const matches = [...source.matchAll(/headline:\s*'([^']+)'/g)].map((m) => m[1]);
  if (matches.length < 2) {
    throw new Error('build-og-image: could not read both headlines from src/i18n/content.ts');
  }
  return { en: matches[0], de: matches[1] };
}

const logo = readFileSync(join(ROOT, 'public/img/netresearch.svg')).toString('base64');
const raleway = readFileSync(
  join(ROOT, 'node_modules/@fontsource/raleway/files/raleway-latin-900-normal.woff2'),
).toString('base64');
const openSans = readFileSync(
  join(ROOT, 'node_modules/@fontsource/open-sans/files/open-sans-latin-400-normal.woff2'),
).toString('base64');

function card(headline, kicker) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Raleway; font-weight: 900; src: url(data:font/woff2;base64,${raleway}) format('woff2'); }
  @font-face { font-family: 'Open Sans'; font-weight: 400; src: url(data:font/woff2;base64,${openSans}) format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #f8f9fa; display: flex; flex-direction: column;
         align-items: flex-start; justify-content: space-between; padding: 72px;
         font-family: 'Open Sans', sans-serif; }
  .bar { position: absolute; top: 0; left: 0; width: 100%; height: 10px; background: #2F99A4; }
  img { height: 52px; width: auto; }
  h1 { font-family: Raleway, sans-serif; font-weight: 900; font-size: 62px; line-height: 1.1;
       color: #1a1d2e; max-width: 1000px; letter-spacing: -0.02em; }
  p { font-size: 26px; color: #585961; }
  .rule { width: 120px; height: 8px; background: #FF4D00; margin-bottom: 32px; }
</style></head>
<body>
  <div class="bar"></div>
  <img src="data:image/svg+xml;base64,${logo}" alt="">
  <div><div class="rule"></div><h1>${headline}</h1></div>
  <p>${kicker}</p>
</body></html>`;
}

const KICKER = {
  en: 'netresearch.github.io — Open Source by Netresearch DTT GmbH',
  de: 'netresearch.github.io — Open Source von Netresearch DTT GmbH',
};

const texts = headlines();
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
mkdirSync(OUT_DIR, { recursive: true });

for (const lang of ['en', 'de']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(card(texts[lang], KICKER[lang]), { waitUntil: 'networkidle0' });
  const target = join(OUT_DIR, `og-portfolio-${lang}.png`);
  await page.screenshot({ path: target, type: 'png' });
  console.log(`Wrote ${target}`);
}

await browser.close();
