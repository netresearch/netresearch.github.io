import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'src', 'data', 'github-repos.json');

const TWO_YEARS_AGO = new Date();
TWO_YEARS_AGO.setFullYear(TWO_YEARS_AGO.getFullYear() - 2);

function fetchRepos() {
  // Build-time script — all commands use hardcoded values, no user input
  const raw = execSync(
    'gh api orgs/netresearch/repos --paginate ' +
    "--jq '.[] | {name, description, html_url, language, topics, stargazers_count, pushed_at, archived, fork, homepage}'",
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  const repos = raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((r) => {
      if (r.archived) return false;
      if (r.fork) return false;
      if (!r.description) return false;
      if (new Date(r.pushed_at) < TWO_YEARS_AGO) return false;
      return true;
    })
    .map((r) => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      language: r.language,
      topics: r.topics || [],
      stars: r.stargazers_count,
      pushed_at: r.pushed_at,
      homepage: r.homepage || null,
    }));

  for (const repo of repos) {
    try {
      const tag = execSync(
        `gh api repos/netresearch/${repo.name}/releases/latest --jq '.tag_name' 2>/dev/null`,
        { encoding: 'utf-8', timeout: 5000 }
      ).trim();
      if (tag) repo.latestRelease = tag;
    } catch {
      // No release
    }
  }

  // Read featured project names to know which repos need badge extraction
  const featuredYaml = readFileSync(
    join(__dirname, '..', 'src', 'data', 'featured.yaml'),
    'utf-8',
  );
  const featuredProjects = yaml.load(featuredYaml);
  const featuredNames = new Set(featuredProjects.map((p) => p.repo.split('/')[1]));

  // Ensure featured repos that were filtered out (forks, etc.) are included
  const repoNames = new Set(repos.map((r) => r.name));
  for (const name of featuredNames) {
    if (repoNames.has(name)) continue;
    try {
      const raw = execSync(
        `gh api repos/netresearch/${name} --jq '{name, description, html_url, language, topics, stargazers_count, pushed_at, homepage}' 2>/dev/null`,
        { encoding: 'utf-8', timeout: 10000 },
      ).trim();
      const r = JSON.parse(raw);
      const repo = {
        name: r.name,
        description: r.description,
        url: r.html_url,
        language: r.language,
        topics: r.topics || [],
        stars: r.stargazers_count,
        pushed_at: r.pushed_at,
        homepage: r.homepage || null,
      };
      // Fetch latest release
      try {
        const tag = execSync(
          `gh api repos/netresearch/${name}/releases/latest --jq '.tag_name' 2>/dev/null`,
          { encoding: 'utf-8', timeout: 5000 },
        ).trim();
        if (tag) repo.latestRelease = tag;
      } catch {
        // No release
      }
      repos.push(repo);
    } catch {
      // Featured repo not accessible
    }
  }

  // For featured repos, fetch README and extract quality badges
  for (const repo of repos) {
    if (!featuredNames.has(repo.name)) continue;
    try {
      const decoded = fetchReadme(repo.name);
      if (!decoded) continue;

      const badges = extractBadges(decoded);
      if (badges.length > 0) {
        repo.qualityBadges = badges;
      }
    } catch {
      // README fetch failed — skip badges for this repo
    }
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(repos, null, 2));
  console.log(`Wrote ${repos.length} repos to ${OUTPUT}`);
}

/**
 * Fetch and decode a repo's README content via GitHub API.
 * Returns the decoded UTF-8 string, or null on failure.
 */
function fetchReadme(repoName) {
  try {
    const readme = execSync(
      `gh api repos/netresearch/${repoName}/readme --jq '.content' 2>/dev/null`,
      { encoding: 'utf-8', timeout: 10000 },
    ).trim();
    return Buffer.from(readme, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Extract quality/CI badges from decoded README content.
 */
function extractBadges(decoded) {
  const badges = [];

  // Extract markdown badge image URLs: ![alt](url)
  const mdBadgePattern = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = mdBadgePattern.exec(decoded)) !== null) {
    const badge = classifyBadge(match[1], match[2]);
    if (badge) badges.push(badge);
  }

  // Extract HTML <img> badge URLs
  const htmlBadgePattern =
    /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*(?:alt=["']([^"']+)["'])?/g;
  while ((match = htmlBadgePattern.exec(decoded)) !== null) {
    const badge = classifyBadge(match[2], match[1]);
    if (badge) badges.push(badge);
  }

  return badges;
}

/**
 * Classify a badge URL into a known quality/CI category.
 * Returns null for badges we don't care about (license, version, etc.).
 */
function classifyBadge(alt, url) {
  if (!url) return null;
  const lUrl = url.toLowerCase();
  const lAlt = (alt || '').toLowerCase();

  let badgeType = null;
  if (lUrl.includes('codecov') || lAlt.includes('codecov') || lAlt.includes('coverage')) {
    badgeType = 'codecov';
  } else if (
    lUrl.includes('scorecard') ||
    lUrl.includes('ossf') ||
    lUrl.includes('openssf') ||
    lUrl.includes('bestpractices')
  ) {
    badgeType = 'openssf';
  } else if (lUrl.includes('slsa') || lAlt.includes('slsa')) {
    badgeType = 'slsa';
  } else if (
    (lUrl.includes('github') && lUrl.includes('actions') && lUrl.includes('workflow')) ||
    (lUrl.includes('github.com') && lUrl.includes('/actions/'))
  ) {
    badgeType = 'ci';
  } else if (lUrl.includes('go-report') || lUrl.includes('goreportcard')) {
    badgeType = 'goreport';
  }

  if (!badgeType) return null;
  return { type: badgeType, alt: alt || badgeType, url };
}

fetchRepos();
