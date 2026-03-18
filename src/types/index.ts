export interface PRSummary {
  number: number;
  title: string;
  url: string;
  branch: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
}

export interface BotSections {
  relatedPRs: PRSummary[];
  dependsOn: PRSummary | null;
  hasEnvChange: boolean;
}

export interface DependencyGraph {
  [jiraKey: string]: {
    PRs: number[];
    blocked: number[];
    envChange: number[];
  };
}
