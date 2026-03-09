export interface Category {
  id: string;
  title: string;
  topicMatchers: string[];
  languageMatchers: string[];
}

export const categories: Category[] = [
  {
    id: 'cms-extensions',
    title: 'CMS Extensions',
    topicMatchers: ['typo3-extension', 'typo3'],
    languageMatchers: [],
  },
  {
    id: 'ai-agent-skills',
    title: 'AI/Agent Skills',
    topicMatchers: ['agent-skill', 'claude-code', 'mcp'],
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
    topicMatchers: ['sdk', 'library'],
    languageMatchers: ['Go'],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure & DevOps',
    topicMatchers: ['docker', 'ansible', 'terraform', 'ci-cd', 'devops'],
    languageMatchers: ['Dockerfile', 'Shell', 'Jinja'],
  },
];

export function categorizeRepo(
  topics: string[],
  language: string | null,
  name: string,
): string {
  for (const cat of categories) {
    if (topics.some((t) => cat.topicMatchers.some((m) => t.includes(m)))) {
      return cat.id;
    }
  }

  if (name.startsWith('t3x-')) return 'cms-extensions';
  if (name.endsWith('-skill')) return 'ai-agent-skills';
  if (name.startsWith('docker-') || name.startsWith('ansible-') || name.startsWith('terraform-'))
    return 'infrastructure';

  for (const cat of categories) {
    if (language && cat.languageMatchers.includes(language)) {
      return cat.id;
    }
  }

  return 'developer-tools';
}
