export const languageColors: Record<string, string> = {
  Go: '#00ADD8',
  PHP: '#4F5D95',
  TypeScript: '#3178C6',
  JavaScript: '#F1E05A',
  Python: '#3572A5',
  Shell: '#89E051',
  Dockerfile: '#384D54',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Ruby: '#701516',
  Jinja: '#A52A22',
  Makefile: '#427819',
  Vue: '#41B883',
};

export function getLanguageColor(language: string | null | undefined): string {
  if (!language) return '#8b949e';
  return languageColors[language] || '#8b949e';
}
