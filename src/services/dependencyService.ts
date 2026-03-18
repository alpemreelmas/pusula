import { PRSummary } from "../types";

type Octokit = {
  paginate: (fn: unknown, params: unknown) => Promise<unknown[]>;
  pulls: {
    list: unknown;
    get: (params: unknown) => Promise<{ data: { body: string | null; number: number } }>;
    update: (params: unknown) => Promise<unknown>;
  };
  issues: {
    removeLabel: (params: unknown) => Promise<unknown>;
  };
};

const BOT_SECTION_REGEX = /<!-- pr-bot:start -->[\s\S]*?<!-- pr-bot:end -->/;
const DEPENDS_ON_REGEX = /\*\*Depends on\*\*: \[#(\d+)\]/;

export function resolveDependency(
  currentPR: { number: number; createdAt: string },
  relatedPRs: PRSummary[]
): PRSummary | null {
  const openPredecessors = relatedPRs.filter(
    (pr) =>
      pr.state === "open" &&
      new Date(pr.createdAt) < new Date(currentPR.createdAt)
  );

  if (openPredecessors.length === 0) return null;

  return openPredecessors.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];
}

export async function removeDependencyFromDependents(
  octokit: Octokit,
  owner: string,
  repo: string,
  closedPrNumber: number
): Promise<void> {
  const allPRs = (await octokit.paginate(octokit.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  })) as Array<{ number: number }>;

  for (const pr of allPRs) {
    try {
      const { data } = await octokit.pulls.get({ owner, repo, pull_number: pr.number });
      const body = data.body ?? "";

      const botMatch = body.match(BOT_SECTION_REGEX);
      if (!botMatch) continue;

      const dependsMatch = botMatch[0].match(DEPENDS_ON_REGEX);
      if (!dependsMatch || Number(dependsMatch[1]) !== closedPrNumber) continue;

      // Strip dependency line from bot section
      const newBotSection = botMatch[0]
        .replace(/\n⚠️ \*\*Depends on\*\*: \[#\d+\]\([^)]+\)/g, "")
        .replace(/^\n+/, "");

      const newBody = body.replace(BOT_SECTION_REGEX, newBotSection);
      await octokit.pulls.update({ owner, repo, pull_number: pr.number, body: newBody });

      try {
        await octokit.issues.removeLabel({
          owner,
          repo,
          issue_number: pr.number,
          name: "blocked",
        });
      } catch {
        // Label may not exist; swallow 404
      }
    } catch {
      // Swallow errors for individual PRs
    }
  }
}
