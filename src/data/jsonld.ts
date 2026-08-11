import type { Lang } from '../i18n';
import { absolute, languages, site as siteUrl } from '../i18n';
import { useContent } from '../i18n/content';
import { site } from './site';
import type { Product } from './load-manifest';
import type { ImpactSnapshot } from './load-impact';

/**
 * JSON-LD builders.
 *
 * Rule for everything in this file: describe only what the page actually shows.
 * No node states a fact the visitor cannot read on the rendered page, and no
 * node repeats a figure the page did not render.
 */

export function organization(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Netresearch DTT GmbH',
    url: site.company,
    logo: `${siteUrl}/img/netresearch.svg`,
    sameAs: [site.github],
  };
}

export function website(lang: Lang): Record<string, unknown> {
  const t = useContent(lang);
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: absolute('home', lang),
    name: 'Netresearch Open Source',
    description: t.meta.description,
    inLanguage: languages[lang].htmlLang,
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}

export function breadcrumbs(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** The AI stack section, as an ordered list of the products it renders. */
export function productList(products: Product[], lang: Lang): Record<string, unknown> {
  return {
    '@type': 'ItemList',
    '@id': `${absolute('home', lang)}#ai-stack`,
    name: useContent(lang).aiStack.heading,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: product.name,
        url: product.page,
        applicationCategory: 'DeveloperApplication',
        description: product.summary[lang],
        ...(product.main_version ? { softwareVersion: product.main_version } : {}),
        ...(product.license ? { license: product.license } : {}),
        codeRepository: product.repository,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    })),
  };
}

/**
 * The impact section as a Dataset reference. It points at the dashboard that
 * produced the figures rather than claiming this page is the dataset.
 */
export function impactDataset(impact: ImpactSnapshot, lang: Lang): Record<string, unknown> {
  const t = useContent(lang);
  return {
    '@type': 'Dataset',
    '@id': `${impact.dashboard}#dataset`,
    name: t.impact.heading,
    description: t.impact.intro,
    url: impact.dashboard,
    dateModified: impact.generated_at,
    creator: { '@id': `${siteUrl}/#organization` },
    measurementTechnique: t.impact.method.join(' '),
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: impact.source,
    },
  };
}

export function collectionPage(
  lang: Lang,
  url: string,
  name: string,
  description: string,
): Record<string, unknown> {
  return {
    '@type': 'CollectionPage',
    url,
    name,
    description,
    inLanguage: languages[lang].htmlLang,
    isPartOf: { '@id': `${siteUrl}/#website` },
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}
