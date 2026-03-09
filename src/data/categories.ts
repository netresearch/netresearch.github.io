export interface Category {
  id: string;
  title: string;
  topicMatchers: string[];
  languageMatchers: string[];
}

export const categories: Category[] = [
  {
    id: 'ai-agent-skills',
    title: 'AI/Agent Skills',
    topicMatchers: ['agent-skill', 'claude-code-skill', 'claude-code-marketplace'],
    languageMatchers: [],
  },
  {
    id: 'cms-extensions',
    title: 'CMS Extensions',
    topicMatchers: ['typo3-extension'],
    languageMatchers: [],
  },
  {
    id: 'ecommerce',
    title: 'eCommerce & Shipping',
    topicMatchers: ['magento', 'magento1', 'magento2', 'dhl', 'shipping'],
    languageMatchers: [],
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
  {
    id: 'infrastructure',
    title: 'Infrastructure & DevOps',
    topicMatchers: ['docker', 'ansible', 'terraform', 'ci-cd', 'devops'],
    languageMatchers: ['Dockerfile', 'Shell', 'Jinja'],
  },
];

// Repos that are general-purpose despite having topic overlap with specific categories
const overrides: Record<string, string> = {
  'composer-audit-responsibility': 'developer-tools',
  'sdk-api-central-station': 'libraries-sdks',
  'sdk-api-universal-messenger': 'libraries-sdks',
  'sdk-eu-vat': 'libraries-sdks',
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
  if (name.startsWith('t3x-')) return 'cms-extensions';
  if (name.startsWith('dhl-') || name.startsWith('deutschepost-')) return 'ecommerce';
  if (name.startsWith('sdk-')) return 'libraries-sdks';
  if (name.startsWith('docker-') || name.startsWith('ansible-') || name.startsWith('terraform-'))
    return 'infrastructure';

  // Language-based fallback (only for Shell/Dockerfile → infrastructure)
  for (const cat of categories) {
    if (language && cat.languageMatchers.includes(language)) {
      return cat.id;
    }
  }

  // Default
  return 'developer-tools';
}
