export interface Category {
  id: string;
  title: string;
  topicMatchers: string[];
  languageMatchers: string[];
  servicePromo?: string;
}

export const categories: Category[] = [
  {
    id: 'ai-agent-skills',
    title: 'AI/Agent Skills',
    topicMatchers: ['agent-skill', 'claude-code-skill', 'claude-code-marketplace'],
    languageMatchers: [],
    servicePromo: 'Netresearch builds AI-powered workflows and agent integrations for enterprise teams.',
  },
  {
    id: 'cms-extensions',
    title: 'CMS Extensions',
    topicMatchers: ['typo3-extension'],
    languageMatchers: [],
    servicePromo: 'Netresearch offers TYPO3 services for B2C and B2B including DevOps, operations, support, upgrades, and migrations.',
  },
  {
    id: 'ecommerce',
    title: 'eCommerce & Shipping',
    topicMatchers: ['magento', 'magento1', 'magento2', 'dhl', 'deutsche-post', 'shipping', 'shopware', 'orocommerce'],
    languageMatchers: [],
    servicePromo: 'Netresearch offers eCommerce services for B2C and B2B including DevOps, operations, support, upgrades, customizations and migrations.',
  },
  {
    id: 'applications',
    title: 'Applications',
    topicMatchers: ['application', 'webapp', 'self-service'],
    languageMatchers: [],
    servicePromo: 'Netresearch offers custom software development for B2C and B2B including DevOps, operations, support, and consulting.',
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure & DevOps',
    topicMatchers: ['docker', 'ansible', 'terraform', 'ci-cd', 'devops'],
    languageMatchers: ['Dockerfile', 'Jinja'],
    servicePromo: 'Netresearch offers DevOps and infrastructure services including CI/CD, container orchestration, and cloud operations.',
  },
  {
    id: 'developer-tools',
    title: 'Developer Tools',
    topicMatchers: ['developer-tools', 'cli', 'devtool'],
    languageMatchers: [],
  },
  {
    id: 'libraries-sdks',
    title: 'Libraries & SDKs',
    topicMatchers: ['sdk', 'library', 'php-library'],
    languageMatchers: [],
  },
];

// Repos that are general-purpose despite having topic overlap with specific categories
const overrides: Record<string, string> = {
  'composer-audit-responsibility': 'libraries-sdks',
};

export function categorizeRepo(
  topics: string[],
  language: string | null,
  name: string,
): string {
  // Explicit overrides for repos with misleading topics
  if (overrides[name]) return overrides[name];

  // Topic-based matching (order matters — more specific categories first)
  for (const cat of categories) {
    if (topics.some((t) => cat.topicMatchers.some((m) => t.includes(m)))) {
      return cat.id;
    }
  }

  // Name-prefix based fallbacks
  if (name.endsWith('-skill')) return 'ai-agent-skills';
  if (name.startsWith('t3x-') || name.startsWith('nr-landingpage')) return 'cms-extensions';
  if (name.startsWith('dhl-') || name.startsWith('deutschepost-')) return 'ecommerce';
  if (name.startsWith('sdk-')) return 'libraries-sdks';
  if (name.startsWith('docker-') || name.startsWith('ansible-') || name.startsWith('terraform-'))
    return 'infrastructure';

  // Language-based fallback
  for (const cat of categories) {
    if (language && cat.languageMatchers.includes(language)) {
      return cat.id;
    }
  }

  // Default
  return 'developer-tools';
}
