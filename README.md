# netresearch.github.io

Portfolio and discovery hub for Netresearch Open Source, and the aggregator for
the organisation's project manifests.

## Tech stack

- [Astro](https://astro.build/) — static site generator
- [Tailwind CSS](https://tailwindcss.com/) v4 — utility-first styling
- GitHub Actions — daily build, verified before deploy

## Development

```bash
npm install
npm run fetch-data   # repository metadata + product manifests + impact snapshot
npm run dev
npm run build
npm run verify       # gate the built site in dist/
npm run build-og-image  # regenerate the social cards after a headline change
```

`npm run fetch-data` is a prerequisite for `dev` and `build`: every fact the site
renders comes from those artefacts, and none of them are committed.

It needs a GitHub token. Unauthenticated requests are capped at 60 an hour, and
a rate-limited run would otherwise produce a manifest with empty version fields
— a page that states nothing while looking like it states something. The script
aborts instead:

```bash
GITHUB_TOKEN="$(gh auth token)" npm run fetch-data
```

The deploy workflow exposes the token for that phase only and drops it again
before the site build.

## Where the facts come from

| Fact on the page | Source | Produced by |
| --- | --- | --- |
| Product status and versions | each product's `project-manifest.json` | `scripts/build-manifest.mjs` |
| Impact figures | `https://netresearch.github.io/maint/data/latest.json` | `scripts/fetch-impact.mjs` |
| Repository metadata, releases | GitHub API | `scripts/fetch-repos.mjs` |
| Portfolio framing, review date | `src/data/products.yaml`, `src/data/curated.yaml`, `src/data/site.ts` | edited by hand |
| Social card headline | `src/i18n/content.ts` | `scripts/build-og-image.mjs` |

Nothing else may state a version, a release date or a measured figure.

### Four version fields, deliberately kept apart

`latest release`, `main branch`, `documentation version` and `page last reviewed`
measure four different things. A difference between them is not a contradiction,
and collapsing them into one "version" is what made the pages look inconsistent.

## The project manifest

Every product repository publishes `project-manifest.json` at its Pages root,
generated from its own release data. The canonical schema lives here:

- `public/schema/project-manifest.schema.json`
- published at <https://netresearch.github.io/schema/project-manifest.schema.json>

`scripts/build-manifest.mjs` collects them into
<https://netresearch.github.io/projects.json>, which the other sites consume.

A product that does not publish a manifest yet is *derived* from the GitHub API
plus the `stage_fallback` in `src/data/products.yaml`, marked
`manifest_source: "derived"`, and reported as a warning by `npm run verify`. The
product page also says so, rather than presenting derived data as reviewed truth.

To onboard a product: add it to `src/data/products.yaml`, then make its
repository emit a manifest that validates against the schema.

## Build gate

`scripts/verify-site.mjs` runs against `dist/` and fails the build on:

- a counter rendered as `0`, or `Loading…` text, in the initial HTML
- a version string that came from no build artefact
- a product without a maturity stage, or a published manifest without an owner
  or a review date
- an impact snapshot older than 14 days, or site copy unreviewed for more than
  `MAX_VERIFIED_AGE_DAYS`
- a missing title, description, canonical, `x-default` hreflang, `og:image`,
  `twitter:card` or JSON-LD block
- invalid JSON-LD, or a node without `@type`
- a contact link missing any UTM parameter, or a page with no business CTA
- the logo appearing other than exactly once, or below 32px
- an internal link that does not resolve
- an `og:image` that does not exist in the build
- a page with no `lang`, no `<main>`, more or fewer than one `<h1>`, a skipped
  heading level, an `<img>` without `alt`, a link or button with no accessible
  name, a form control with no label, a table without a caption or `th` scope, a
  positive `tabindex`, or a duplicate `id`
- a missing `sitemap.xml`, `robots.txt`, `llms.txt`, `projects.json` or schema

## Content

- `src/i18n/content.ts` — all page copy, English and German
- `src/i18n/index.ts` — route table, hreflang alternates, UTM-tagged contact URLs
- `src/data/curated.yaml` — front-page selection, classified by user problem
- `src/data/featured.yaml` — repositories whose README badges are extracted

English is served from `/`, German from `/de/`. `/en/` redirects to `/` so the
organisation's strongest URL stays canonical. Routes are declared once in
`src/i18n/index.ts`; the sitemap and the hreflang links are generated from it, so
a new page cannot exist without being registered.

## Deployment

Built and deployed to GitHub Pages on every push to `master`, daily at 06:00 UTC,
and via workflow dispatch. Deployment runs `npm run verify` first — a build that
fails the gate is not published.
