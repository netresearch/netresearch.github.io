export const languages = {
  en: { label: 'English', htmlLang: 'en', ogLocale: 'en_GB' },
  de: { label: 'Deutsch', htmlLang: 'de', ogLocale: 'de_DE' },
} as const;

export type Lang = keyof typeof languages;

/** English serves the bare root, so the org's strongest URL stays the canonical one. */
export const defaultLang: Lang = 'en';
export const site = 'https://netresearch.github.io';

/**
 * Localised route table. Both languages get real German/English path segments
 * rather than a shared slug, and every page is registered here so the hreflang
 * and sitemap generators cannot drift from the actual routes.
 */
export const routes = {
  home: { en: '/', de: '/de/' },
  projects: { en: '/projects/', de: '/de/projekte/' },
} as const;

export type RouteKey = keyof typeof routes;

export function path(key: RouteKey, lang: Lang): string {
  return routes[key][lang];
}

export function absolute(key: RouteKey, lang: Lang): string {
  return `${site}${path(key, lang)}`;
}

/** The alternates for one page, in the shape <link rel="alternate"> needs. */
export function alternates(key: RouteKey): { hreflang: string; href: string }[] {
  return [
    ...(Object.keys(languages) as Lang[]).map((lang) => ({
      hreflang: languages[lang].htmlLang,
      href: absolute(key, lang),
    })),
    { hreflang: 'x-default', href: absolute(key, defaultLang) },
  ];
}

/**
 * Business CTA target. Every business call to action on every page points at
 * the same contact form, tagged so the campaign report can tell page and
 * position apart.
 */
export function contactUrl(campaign: string, content: string): string {
  const params = new URLSearchParams({
    utm_source: 'github-pages',
    utm_medium: 'referral',
    utm_campaign: campaign,
    utm_content: content,
  });
  return `https://www.netresearch.de/kontakt/?${params.toString()}`;
}
