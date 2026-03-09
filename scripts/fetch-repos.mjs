import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(repos, null, 2));
  console.log(`Wrote ${repos.length} repos to ${OUTPUT}`);
}

fetchRepos();
