/**
 * Pull the impact figures from the maint dashboard's build artefact.
 *
 * The hub renders impact numbers statically, and it renders exactly the numbers
 * the dashboard published — there is no second measurement and no second
 * definition. Every figure the hub shows must be traceable to
 * https://netresearch.github.io/maint/data/latest.json.
 *
 * The output is a build artefact and is not committed. If the dashboard is
 * unreachable the build fails rather than shipping a page whose figures are
 * silently older than they look.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = 'https://netresearch.github.io/maint/data/latest.json';
const OUT = join(__dirname, '..', 'src', 'data', 'impact.json');

/** Figures the hub is allowed to show, and where each one comes from. */
const KPIS = [
  { key: 'repos', from: 'totals.repos' },
  { key: 'releases', from: 'totals.releases' },
  { key: 'contributors', from: 'totals.contributors' },
  { key: 'external_contributors', from: 'totals.external_contributors' },
  { key: 'packagist_downloads', from: 'totals.packagist_downloads' },
  { key: 'ghcr_downloads', from: 'totals.ghcr_downloads' },
  { key: 'dependents_repos', from: 'totals.dependents_repos' },
  { key: 'stars', from: 'totals.stars' },
  { key: 'commits_30d', from: 'totals.commits_30d' },
  { key: 'releases_30d', from: 'totals.releases_30d' },
  { key: 'prs_merged_30d', from: 'totals.prs_merged_30d' },
];

function pick(obj, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), obj);
}

async function main() {
  let snapshot;
  try {
    const res = await fetch(SOURCE, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    snapshot = await res.json();
  } catch (err) {
    // The failure reason is not echoed: it is network-influenced text, and the
    // exception itself already carries it for anyone reading the build log.
    console.error(`impact: ${SOURCE} unreachable. Refusing to build without current figures.`);
    console.error(err);
    process.exit(1);
  }

  // generated_at is rendered into the page and into a datetime attribute, so it
  // is validated as an ISO timestamp rather than trusted. A dashboard that
  // cannot say when it ran is a dashboard whose figures have no age.
  const generatedAt = String(snapshot.generated_at ?? '');
  if (Number.isNaN(Date.parse(generatedAt))) {
    console.error(`impact: ${SOURCE} reported an unparseable generated_at`);
    process.exit(1);
  }

  const kpis = {};
  const missing = [];
  for (const { key, from } of KPIS) {
    const value = pick(snapshot, from);
    if (typeof value !== 'number') {
      missing.push(from);
      continue;
    }
    kpis[key] = value;
  }

  const output = {
    source: SOURCE,
    dashboard: 'https://netresearch.github.io/maint/',
    generated_at: generatedAt,
    fetched_at: new Date().toISOString(),
    traffic_available: snapshot.traffic_available === true,
    // Figures the dashboard did not publish this run. Named rather than
    // silently defaulted to 0 — a missing measurement is not a zero.
    unavailable: missing,
    kpis,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(
    `Wrote impact snapshot generated ${new Date(generatedAt).toISOString()}` +
      (missing.length ? ` (${missing.length} figures unavailable)` : ''),
  );
}

await main();
