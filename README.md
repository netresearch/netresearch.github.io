# netresearch.github.io

Netresearch Open Source portfolio and showcase site.

## Tech Stack

- [Astro](https://astro.build/) — static site generator
- [Tailwind CSS](https://tailwindcss.com/) v4 — utility-first styling
- GitHub Actions — daily builds with auto-deployed GitHub Pages

## Development

```bash
npm install
npm run fetch-repos   # Fetch GitHub org metadata
npm run dev           # Start dev server
npm run build         # Production build
npm run preview       # Preview production build
```

## Adding Featured Projects

Edit `src/data/featured.yaml` to add or update curated project entries. All other repos are auto-populated from the GitHub API at build time.

## Deployment

The site is automatically built and deployed to GitHub Pages:
- On every push to `master`
- Daily at 06:00 UTC (to refresh repo metadata)
- Manually via workflow dispatch
