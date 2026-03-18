import { PRSummary } from "../types";

type Octokit = {
  paginate: (fn: unknown, params: unknown) => Promise<unknown[]>;
  pulls: {
    list: unknown;
  };
};

interface RawPR {
  number: number;
  title: string;
  html_url: string;
  head: { ref: string };
  state: string;
  pull_request?: { merged_at: string | null };
  merged_at?: string | null;
  created_at: string;
}

function toState(pr: RawPR): PRSummary["state"] {
  if (pr.merged_at) return "merged";
  if (pr.state === "closed") return "closed";
  return "open";
}

export async function findRelatedPRs(
  octokit: Octokit,
  owner: string,
  repo: string,
  jiraKeys: string[],
  excludePrNumber: number
): Promise<PRSummary[]> {
  if (jiraKeys.length === 0) return [];

  const allPRs = (await octokit.paginate(octokit.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  })) as RawPR[];

  return allPRs
    .filter((pr) => {
      if (pr.number === excludePrNumber) return false;
      return jiraKeys.some((key) => pr.title.includes(key));
    })
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: `https://github.com/${owner}/${repo}/pull/${pr.number}`,
      branch: pr.head.ref,
      state: toState(pr),
      createdAt: pr.created_at,
    }));
}
