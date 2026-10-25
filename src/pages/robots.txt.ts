import type { APIRoute } from 'astro';

/**
 * Deliberately permissive. Googlebot, Bingbot and OAI-SearchBot are named
 * explicitly so a future blanket rule cannot lock them out by accident, and the
 * sitemap plus the machine-readable endpoints are advertised here.
 */
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

Sitemap: https://netresearch.github.io/sitemap.xml
Sitemap: https://netresearch.github.io/modularer-ki-stack-page/sitemap.xml
Sitemap: https://netresearch.github.io/maint/sitemap.xml
Sitemap: https://netresearch.github.io/t3x-nr-browser-ai/sitemap.xml
Sitemap: https://netresearch.github.io/t3x-nr-mcp-agent/sitemap.xml
Sitemap: https://netresearch.github.io/t3x-nr-llm/sitemap.xml
Sitemap: https://netresearch.github.io/claude-code-marketplace/sitemap.xml

# Machine-readable orientation for assistants. Convenience endpoints, not a
# ranking mechanism and not a standard.
# https://netresearch.github.io/llms.txt
# https://netresearch.github.io/projects.json
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
