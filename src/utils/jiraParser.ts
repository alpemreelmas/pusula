const JIRA_KEY_PATTERN = /[A-Z]+-\d+/g;

export function parseJiraKeys(text: string): string[] {
  const matches = text.match(JIRA_KEY_PATTERN);
  if (!matches) return [];
  return [...new Set(matches)];
}
