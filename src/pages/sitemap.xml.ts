import type { APIRoute } from 'astro';
import { absolute, alternates, languages, routes, type Lang, type RouteKey } from '../i18n';
import { site } from '../data/site';

/**
 * Sitemap built from the route table, so a new page cannot exist without
 * appearing here. Each entry carries its xhtml:link alternates, which is what
 * makes the DE/EN pairing machine-readable rather than merely present in the
 * page head.
 */
export const GET: APIRoute = () => {
  const entries = (Object.keys(routes) as RouteKey[]).flatMap((route) =>
    (Object.keys(languages) as Lang[]).map((lang) => ({
      loc: absolute(route, lang),
      alternates: alternates(route),
    })),
  );

  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${site.lastVerified}</lastmod>
${entry.alternates
  .map(
    (alt) =>
      `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`,
  )
  .join('\n')}
  </url>`,
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
