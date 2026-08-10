/**
 * Review metadata for the hub itself.
 *
 * `lastVerified` records when a person last checked this site's non-derived
 * copy — the business and governance statements that no script can validate.
 * It is deliberately not a version and not a build timestamp. verify-site.mjs
 * fails the build once it is older than MAX_AGE_DAYS.
 */
export const site = {
  lastVerified: '2026-08-10',
  owner: 'Netresearch DTT GmbH — Open Source Team',
  /** Campaign name used in every UTM-tagged contact link on this site. */
  utmCampaign: 'portfolio',
  ogImage: '/img/og-portfolio.png',
  contact: 'https://www.netresearch.de/kontakt/',
  imprint: 'https://www.netresearch.de/impressum/',
  privacy: 'https://www.netresearch.de/datenschutz/',
  company: 'https://www.netresearch.de/',
  github: 'https://github.com/netresearch',
} as const;

/** Copy older than this fails the build rather than quietly ageing on the page. */
export const MAX_VERIFIED_AGE_DAYS = 180;
