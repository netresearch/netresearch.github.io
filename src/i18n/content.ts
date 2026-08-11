import type { Lang } from './index';

export interface EntryPath {
  id: string;
  audience: string;
  question: string;
  answer: string;
  linkLabel: string;
  href: string;
}

export interface WhyCard {
  id: string;
  /** Which impact KPI backs this statement. Null means the claim is not a measured figure. */
  kpi: string | null;
  label: string;
  detail: string;
}

export interface Facet {
  id: string;
  label: string;
}

export interface PageContent {
  meta: { title: string; description: string; ogImageAlt: string };
  nav: {
    label: string;
    aiStack: string;
    impact: string;
    projects: string;
    contact: string;
    menu: string;
    close: string;
    langSwitch: string;
    theme: string;
  };
  hero: {
    headline: string;
    sub: string;
    primaryCta: string;
    secondaryCta: string;
  };
  entryPaths: { heading: string; intro: string; items: EntryPath[] };
  aiStack: {
    heading: string;
    intro: string;
    stageLabel: string;
    releaseLabel: string;
    mainLabel: string;
    suitedForLabel: string;
    boundaryLabel: string;
    reviewedLabel: string;
    derivedNote: string;
    stackLink: string;
    stackLinkHref: string;
  };
  impact: {
    heading: string;
    intro: string;
    asOf: string;
    methodHeading: string;
    method: string[];
    sourceLabel: string;
    kpis: Record<string, string>;
    unavailable: string;
  };
  portfolio: {
    heading: string;
    intro: string;
    filterLabel: string;
    allLabel: string;
    facets: Facet[];
    catalogueLink: string;
    starsLabel: string;
    releaseLabel: string;
  };
  why: { heading: string; intro: string; cards: WhyCard[] };
  consulting: {
    heading: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  catalogue: {
    title: string;
    description: string;
    heading: string;
    intro: string;
    backLink: string;
    countLabel: string;
    emptyLabel: string;
    sitesHeading: string;
    sitesIntro: string;
  };
  footer: {
    company: string;
    contact: string;
    imprint: string;
    privacy: string;
    github: string;
    reviewed: string;
    dataNote: string;
  };
  stages: Record<string, string>;
  breadcrumbHome: string;
  skipToContent: string;
}

const en: PageContent = {
  meta: {
    title: 'Netresearch Open Source — TYPO3, AI infrastructure and developer tools',
    description:
      'Open-source infrastructure for TYPO3, AI and digital business processes: a controllable AI stack, proven CMS and commerce components, and measured usage data.',
    ogImageAlt: 'Netresearch Open Source portfolio',
  },
  nav: {
    label: 'Main navigation',
    aiStack: 'AI stack',
    impact: 'Impact',
    projects: 'Projects',
    contact: 'Contact',
    menu: 'Open menu',
    close: 'Close menu',
    langSwitch: 'Deutsch',
    theme: 'Toggle dark mode',
  },
  hero: {
    headline: 'Open-source infrastructure for TYPO3, AI and digital business processes.',
    sub: 'From secure AI integration and agents through to proven TYPO3 and commerce components — developed in the open, operated transparently, and measurably in use.',
    primaryCta: 'Explore the AI stack',
    secondaryCta: 'Discuss your architecture',
  },
  entryPaths: {
    heading: 'Where do you want to start?',
    intro: 'Four routes through the same portfolio, sorted by the question you arrived with.',
    items: [
      {
        id: 'decision-makers',
        audience: 'Decision makers and architects',
        question: 'How do we get AI into TYPO3 without vendor lock-in?',
        answer:
          'The modular AI stack separates secrets, control plane, assistance and channels, so each layer can be replaced on its own.',
        linkLabel: 'Modular AI stack',
        href: 'https://netresearch.github.io/modularer-ki-stack-page/',
      },
      {
        id: 'developers',
        audience: 'Development teams',
        question: 'How do we stop re-implementing the same provider integration?',
        answer:
          'nr-llm centralises providers, keys, caching, streaming, tool calling and error handling behind one injectable service.',
        linkLabel: 'nr-llm for developers',
        href: 'https://netresearch.github.io/t3x-nr-llm/',
      },
      {
        id: 'security',
        audience: 'Security and governance',
        question: 'Who may do what, and what leaves our network?',
        answer:
          'Encrypted key storage, per-capability permissions, per-user budgets, approval-gated write tools and an audit trail — described control by control.',
        linkLabel: 'Governance and security',
        href: 'https://netresearch.github.io/t3x-nr-llm/en/security/',
      },
      {
        id: 'editorial',
        audience: 'Editorial and marketing',
        question: 'What does assisted editing actually look like?',
        answer:
          'A backend agent that reads by default and pauses for human approval before it writes — plus an on-device assistant for page-level questions.',
        linkLabel: 'Backend agent',
        href: 'https://netresearch.github.io/t3x-nr-mcp-agent/',
      },
    ],
  },
  aiStack: {
    heading: 'The AI stack',
    intro:
      'Four components, each usable on its own. Status, release and main-branch version come from each project’s own manifest, not from this page.',
    stageLabel: 'Status',
    releaseLabel: 'Latest release',
    mainLabel: 'Main branch',
    suitedForLabel: 'Suited for',
    boundaryLabel: 'Responsibility boundary',
    reviewedLabel: 'Page last reviewed',
    derivedNote:
      'Derived from the repository — this project does not publish a manifest yet, so status comes from the portfolio’s fallback.',
    stackLink: 'How the layers fit together',
    stackLinkHref: 'https://netresearch.github.io/modularer-ki-stack-page/',
  },
  impact: {
    heading: 'Measured activity',
    intro:
      'Every figure below is the value the impact dashboard published in its last run. This page performs no measurement of its own.',
    asOf: 'Data as of',
    methodHeading: 'How this is measured',
    method: [
      'Collected from the GitHub API across the organisation’s non-archived repositories, plus Packagist and GHCR download endpoints.',
      'Downloads and releases are cumulative totals; 30-day figures are a rolling window ending at the generation time.',
      'Dependent projects are what GitHub’s dependency graph reports and therefore a lower bound, not a complete count.',
    ],
    sourceLabel: 'Source and full dataset',
    kpis: {
      repos: 'Active repositories',
      releases: 'Releases published',
      contributors: 'Contributors',
      external_contributors: 'External contributors',
      packagist_downloads: 'Packagist downloads',
      ghcr_downloads: 'Container pulls',
      dependents_repos: 'Dependent repositories',
      stars: 'Stars',
      commits_30d: 'Commits (30 days)',
      releases_30d: 'Releases (30 days)',
      prs_merged_30d: 'Pull requests merged (30 days)',
    },
    unavailable: 'Not available in this run',
  },
  portfolio: {
    heading: 'Curated portfolio',
    intro:
      'The projects that carry the most weight in customer work, grouped by the problem they solve rather than by the language they are written in.',
    filterLabel: 'Filter by problem',
    allLabel: 'All',
    facets: [
      { id: 'ai-governance', label: 'AI and governance' },
      { id: 'content-editing', label: 'Content and editing' },
      { id: 'commerce', label: 'Commerce and shipping' },
      { id: 'operations', label: 'Operations and infrastructure' },
      { id: 'developer-experience', label: 'Developer experience' },
    ],
    catalogueLink: 'Full repository catalogue',
    starsLabel: 'stars',
    releaseLabel: 'Latest release',
  },
  why: {
    heading: 'Why Netresearch',
    intro: 'Each statement below names the figure that backs it and where that figure comes from.',
    cards: [
      {
        id: 'active-projects',
        kpi: 'repos',
        label: 'active repositories',
        detail: 'Non-archived and pushed to within the measurement window.',
      },
      {
        id: 'releases',
        kpi: 'releases',
        label: 'releases published',
        detail: 'Tagged releases across the organisation, cumulative.',
      },
      {
        id: 'downloads',
        kpi: 'packagist_downloads',
        label: 'Packagist downloads',
        detail: 'Cumulative installs of the published PHP packages.',
      },
      {
        id: 'external',
        kpi: 'external_contributors',
        label: 'external contributors',
        detail: 'People outside the organisation whose commits were merged.',
      },
      {
        id: 'lts',
        kpi: null,
        label: 'TYPO3 v13.4 and v14.3 LTS',
        detail: 'The LTS versions the current extension releases are tested against in CI.',
      },
      {
        id: 'supply-chain',
        kpi: null,
        label: 'Signed releases where implemented',
        detail:
          'Cosign signatures, SBOMs and SLSA provenance ship on the projects that have adopted them — see each project page for its own state, not a blanket claim.',
      },
    ],
  },
  consulting: {
    heading: 'Evaluating AI in TYPO3?',
    body: 'If you want AI in TYPO3 but need to avoid vendor lock-in, uncontrolled cost and shadow AI, the architecture question comes before the tooling question. We can work through both with you.',
    primaryCta: 'Discuss AI and TYPO3 architecture',
    secondaryCta: 'Explore the AI stack',
  },
  catalogue: {
    title: 'All repositories — Netresearch Open Source',
    description:
      'The complete list of public, actively maintained Netresearch repositories, with language, latest release and star count.',
    heading: 'Full repository catalogue',
    intro:
      'Every public repository that is not archived, is not a fork, has a description, and saw a push within the last two years.',
    backLink: 'Back to the portfolio',
    countLabel: 'repositories',
    emptyLabel: 'No repositories matched this filter.',
    sitesHeading: 'Published sites',
    sitesIntro: 'Project pages, demos and dashboards this organisation publishes.',
  },
  footer: {
    company: 'Netresearch DTT GmbH',
    contact: 'Contact',
    imprint: 'Imprint',
    privacy: 'Privacy',
    github: 'GitHub',
    reviewed: 'Page last reviewed',
    dataNote: 'Figures on this page come from the impact dashboard.',
  },
  stages: {
    concept: 'Concept',
    poc: 'Proof of concept',
    alpha: 'Alpha',
    beta: 'Beta',
    stable: 'Stable',
    maintenance: 'Maintenance',
  },
  breadcrumbHome: 'Open Source',
  skipToContent: 'Skip to content',
};

const de: PageContent = {
  meta: {
    title: 'Netresearch Open Source — TYPO3, KI-Infrastruktur und Entwicklerwerkzeuge',
    description:
      'Open-Source-Infrastruktur für TYPO3, KI und digitale Geschäftsprozesse: ein kontrollierbarer KI-Stack, bewährte CMS- und Commerce-Komponenten und gemessene Nutzungsdaten.',
    ogImageAlt: 'Portfolio von Netresearch Open Source',
  },
  nav: {
    label: 'Hauptnavigation',
    aiStack: 'KI-Stack',
    impact: 'Wirkung',
    projects: 'Projekte',
    contact: 'Kontakt',
    menu: 'Menü öffnen',
    close: 'Menü schließen',
    langSwitch: 'English',
    theme: 'Dunkles Design umschalten',
  },
  hero: {
    headline: 'Open-Source-Infrastruktur für TYPO3, KI und digitale Geschäftsprozesse.',
    sub: 'Von sicherer KI-Integration und Agenten bis zu bewährten TYPO3- und Commerce-Komponenten – offen entwickelt, nachvollziehbar betrieben und messbar genutzt.',
    primaryCta: 'KI-Stack entdecken',
    secondaryCta: 'Architektur besprechen',
  },
  entryPaths: {
    heading: 'Womit möchten Sie anfangen?',
    intro: 'Vier Wege durch dasselbe Portfolio, sortiert nach der Frage, mit der Sie hier ankommen.',
    items: [
      {
        id: 'decision-makers',
        audience: 'Entscheider und Architekten',
        question: 'Wie kommt KI in TYPO3, ohne uns an einen Anbieter zu binden?',
        answer:
          'Der modulare KI-Stack trennt Secrets, Control-Plane, Assistenz und Kanäle, sodass jede Schicht für sich austauschbar bleibt.',
        linkLabel: 'Modularer KI-Stack',
        href: 'https://netresearch.github.io/modularer-ki-stack-page/',
      },
      {
        id: 'developers',
        audience: 'Entwicklungsteams',
        question: 'Wie hören wir auf, dieselbe Provider-Anbindung immer wieder zu bauen?',
        answer:
          'nr-llm bündelt Provider, Schlüssel, Caching, Streaming, Tool-Aufrufe und Fehlerbehandlung hinter einem injizierbaren Service.',
        linkLabel: 'nr-llm für Entwicklung',
        href: 'https://netresearch.github.io/t3x-nr-llm/',
      },
      {
        id: 'security',
        audience: 'Security und Governance',
        question: 'Wer darf was, und was verlässt unser Netz?',
        answer:
          'Verschlüsselte Schlüsselablage, Berechtigungen je Fähigkeit, Budgets je Nutzer, freigabepflichtige Schreibwerkzeuge und ein Audit-Verlauf – Kontrolle für Kontrolle beschrieben.',
        linkLabel: 'Governance und Sicherheit',
        href: 'https://netresearch.github.io/t3x-nr-llm/de/security/',
      },
      {
        id: 'editorial',
        audience: 'Redaktion und Marketing',
        question: 'Wie sieht assistiertes Redigieren konkret aus?',
        answer:
          'Ein Backend-Agent, der standardmäßig liest und vor jedem Schreibvorgang auf eine menschliche Freigabe wartet – dazu ein On-Device-Assistent für Fragen zur aufgerufenen Seite.',
        linkLabel: 'Backend-Agent',
        href: 'https://netresearch.github.io/t3x-nr-mcp-agent/',
      },
    ],
  },
  aiStack: {
    heading: 'Der KI-Stack',
    intro:
      'Vier Bausteine, jeder einzeln einsetzbar. Reifegrad, Release und Version des Hauptzweigs stammen aus dem Manifest des jeweiligen Projekts, nicht aus dieser Seite.',
    stageLabel: 'Reifegrad',
    releaseLabel: 'Letzter Release',
    mainLabel: 'Hauptzweig',
    suitedForLabel: 'Geeignet für',
    boundaryLabel: 'Verantwortungsgrenze',
    reviewedLabel: 'Seite zuletzt geprüft',
    derivedNote:
      'Aus dem Repository abgeleitet – dieses Projekt veröffentlicht noch kein Manifest, der Reifegrad stammt daher aus dem Rückfallwert des Portfolios.',
    stackLink: 'Wie die Schichten zusammenspielen',
    stackLinkHref: 'https://netresearch.github.io/modularer-ki-stack-page/',
  },
  impact: {
    heading: 'Gemessene Aktivität',
    intro:
      'Jeder Wert unten ist genau der Wert, den das Impact-Dashboard im letzten Lauf veröffentlicht hat. Diese Seite misst nichts selbst.',
    asOf: 'Datenstand',
    methodHeading: 'Wie gemessen wird',
    method: [
      'Erhoben über die GitHub-API für alle nicht archivierten Repositories der Organisation, dazu die Download-Endpunkte von Packagist und GHCR.',
      'Downloads und Releases sind kumulierte Summen; die 30-Tage-Werte sind ein gleitendes Fenster bis zum Erhebungszeitpunkt.',
      'Abhängige Projekte sind das, was der Dependency-Graph von GitHub meldet, und damit eine Untergrenze, keine vollständige Zählung.',
    ],
    sourceLabel: 'Quelle und vollständiger Datensatz',
    kpis: {
      repos: 'Aktive Repositories',
      releases: 'Veröffentlichte Releases',
      contributors: 'Mitwirkende',
      external_contributors: 'Externe Mitwirkende',
      packagist_downloads: 'Packagist-Downloads',
      ghcr_downloads: 'Container-Abrufe',
      dependents_repos: 'Abhängige Repositories',
      stars: 'Sterne',
      commits_30d: 'Commits (30 Tage)',
      releases_30d: 'Releases (30 Tage)',
      prs_merged_30d: 'Gemergte Pull Requests (30 Tage)',
    },
    unavailable: 'In diesem Lauf nicht verfügbar',
  },
  portfolio: {
    heading: 'Kuratiertes Portfolio',
    intro:
      'Die Projekte mit dem größten Gewicht in Kundenprojekten, gruppiert nach dem Problem, das sie lösen – nicht nach der Sprache, in der sie geschrieben sind.',
    filterLabel: 'Nach Problem filtern',
    allLabel: 'Alle',
    facets: [
      { id: 'ai-governance', label: 'KI und Governance' },
      { id: 'content-editing', label: 'Inhalt und Redaktion' },
      { id: 'commerce', label: 'Commerce und Versand' },
      { id: 'operations', label: 'Betrieb und Infrastruktur' },
      { id: 'developer-experience', label: 'Entwicklungsalltag' },
    ],
    catalogueLink: 'Vollständiger Repository-Katalog',
    starsLabel: 'Sterne',
    releaseLabel: 'Letzter Release',
  },
  why: {
    heading: 'Warum Netresearch',
    intro: 'Jede Aussage unten nennt die Zahl, die sie belegt, und woher diese Zahl stammt.',
    cards: [
      {
        id: 'active-projects',
        kpi: 'repos',
        label: 'aktive Repositories',
        detail: 'Nicht archiviert und innerhalb des Messzeitraums bespielt.',
      },
      {
        id: 'releases',
        kpi: 'releases',
        label: 'veröffentlichte Releases',
        detail: 'Getaggte Releases über die gesamte Organisation, kumuliert.',
      },
      {
        id: 'downloads',
        kpi: 'packagist_downloads',
        label: 'Packagist-Downloads',
        detail: 'Kumulierte Installationen der veröffentlichten PHP-Pakete.',
      },
      {
        id: 'external',
        kpi: 'external_contributors',
        label: 'externe Mitwirkende',
        detail: 'Personen außerhalb der Organisation, deren Commits übernommen wurden.',
      },
      {
        id: 'lts',
        kpi: null,
        label: 'TYPO3 v13.4 und v14.3 LTS',
        detail: 'Die LTS-Versionen, gegen die die aktuellen Extension-Releases in der CI getestet werden.',
      },
      {
        id: 'supply-chain',
        kpi: null,
        label: 'Signierte Releases, wo umgesetzt',
        detail:
          'Cosign-Signaturen, SBOMs und SLSA-Provenienz liegen den Projekten bei, die das übernommen haben – der jeweilige Stand steht auf der Projektseite, nicht als Pauschalaussage hier.',
      },
    ],
  },
  consulting: {
    heading: 'Sie prüfen KI in TYPO3?',
    body: 'Wenn Sie KI in TYPO3 wollen, aber Anbieterbindung, unkontrollierte Kosten und Schatten-KI vermeiden müssen, steht die Architekturfrage vor der Werkzeugfrage. Beides klären wir mit Ihnen.',
    primaryCta: 'KI- und TYPO3-Architektur besprechen',
    secondaryCta: 'KI-Stack entdecken',
  },
  catalogue: {
    title: 'Alle Repositories — Netresearch Open Source',
    description:
      'Die vollständige Liste der öffentlichen, aktiv gepflegten Repositories von Netresearch, mit Sprache, letztem Release und Sternen.',
    heading: 'Vollständiger Repository-Katalog',
    intro:
      'Jedes öffentliche Repository, das nicht archiviert ist, kein Fork ist, eine Beschreibung hat und in den letzten zwei Jahren bespielt wurde.',
    backLink: 'Zurück zum Portfolio',
    countLabel: 'Repositories',
    emptyLabel: 'Kein Repository passt zu diesem Filter.',
    sitesHeading: 'Veröffentlichte Seiten',
    sitesIntro: 'Projektseiten, Demos und Dashboards, die diese Organisation veröffentlicht.',
  },
  footer: {
    company: 'Netresearch DTT GmbH',
    contact: 'Kontakt',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    github: 'GitHub',
    reviewed: 'Seite zuletzt geprüft',
    dataNote: 'Die Zahlen auf dieser Seite stammen aus dem Impact-Dashboard.',
  },
  stages: {
    concept: 'Konzept',
    poc: 'Machbarkeitsnachweis',
    alpha: 'Alpha',
    beta: 'Beta',
    stable: 'Stabil',
    maintenance: 'Wartung',
  },
  breadcrumbHome: 'Open Source',
  skipToContent: 'Zum Inhalt springen',
};

export const content: Record<Lang, PageContent> = { en, de };

export function useContent(lang: Lang): PageContent {
  return content[lang];
}
