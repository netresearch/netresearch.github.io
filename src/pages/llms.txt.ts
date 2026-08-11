import type { APIRoute } from 'astro';
import { absolute } from '../i18n';
import { loadProducts, orderedProducts } from '../data/load-manifest';
import { loadImpact } from '../data/load-impact';
import { loadCurated } from '../data/load-curated';
import { site } from '../data/site';

/**
 * Convenience orientation for assistants. Everything here is also visible on the
 * rendered pages — this file adds no fact the HTML does not state, so the two
 * cannot drift apart into two different truths.
 *
 * Written as llmstxt.org expects: an H1, a blockquote summary, and H2 sections
 * whose list items are Markdown links, `- [name](url): notes`. A bare URL is not
 * a link, and a reader that parses the format finds no destinations in it.
 */
export const GET: APIRoute = () => {
  const products = orderedProducts(loadProducts().products);
  const impact = loadImpact();
  const curated = loadCurated();

  const productLines = products
    .map((product) => {
      const versions = [
        product.latest_release ? `latest release ${product.latest_release}` : null,
        product.main_version ? `main branch ${product.main_version}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return `- [${product.name}](${product.page}): ${product.stage}${versions ? `, ${versions}` : ''} — ${product.role.en}. ${product.summary.en.trim()}`;
    })
    .join('\n');

  const impactLines = Object.entries(impact.kpis)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const curatedLines = curated
    .map((project) => `- [${project.repo}](${project.url}): ${project.problem.en.trim()}`)
    .join('\n');

  const body = `# Netresearch Open Source

> Open-source infrastructure for TYPO3, AI and digital business processes,
> published by Netresearch DTT GmbH. This file mirrors the rendered pages; it
> introduces no fact that is not visible on them.

## Start here

- [Portfolio (English)](${absolute('home', 'en')}): the AI stack, measured activity and the curated portfolio.
- [Portfolio (Deutsch)](${absolute('home', 'de')}): same content in German.
- [Full repository catalogue](${absolute('projects', 'en')}): every public repository, filterable.
- [Product manifests](https://netresearch.github.io/projects.json): machine-readable status and versions for every product.
- [Manifest schema](https://netresearch.github.io/schema/project-manifest.schema.json): the JSON Schema those manifests validate against.
- [Contact](${site.contact}): Netresearch DTT GmbH.

Page last reviewed: ${site.lastVerified}.

## How to read the version fields

Four different values, deliberately kept apart:

- **latest release** — the most recent published release tag.
- **main branch** — the version on the default branch; may be ahead of the release.
- **documentation version** — the version the published docs describe; may lag both.
- **page last reviewed** — when a person last checked the page's non-derived copy.

A difference between them is not a contradiction. Each product's authoritative
values live in its own project-manifest.json.

## AI stack

${productLines}

## Measured activity

Figures published by the [impact dashboard](${impact.source}), generated ${impact.generated_at}.

${impactLines}

Downloads and releases are cumulative; \`*_30d\` figures are a rolling 30-day
window. Dependent-repository counts come from GitHub's dependency graph and are
a lower bound.

## Curated portfolio

${curatedLines}

## What is not claimed

- No blanket compliance claim for the EU AI Act, NIST AI RMF or ISO/IEC 42001.
  The products support controls; conformity is an organisational assessment.
- No return-on-investment or savings figure is asserted anywhere on this site.
- Supply-chain attestations exist on the projects that have adopted them, stated
  per project rather than across the portfolio.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
