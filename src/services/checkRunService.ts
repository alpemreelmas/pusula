type Octokit = {
  checks: {
    create: (params: unknown) => Promise<{ data: { id: number } }>;
    update: (params: unknown) => Promise<unknown>;
    listForRef: (params: unknown) => Promise<{
      data: { check_runs: Array<{ id: number; name: string }> };
    }>;
  };
};

const CHECK_NAME = "pr-intelligence";

export async function createOrUpdateCheckRun(
  octokit: Octokit,
  owner: string,
  repo: string,
  headSha: string,
  isBlocked: boolean
): Promise<void> {
  const conclusion = isBlocked ? "failure" : "success";
  const summary = isBlocked
    ? "This PR is blocked by an open dependency. Merge the dependency first."
    : "No blocking dependencies detected.";

  const existing = await octokit.checks.listForRef({
    owner,
    repo,
    ref: headSha,
    check_name: CHECK_NAME,
  });

  const existingRun = existing.data.check_runs[0];

  if (existingRun) {
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: existingRun.id,
      status: "completed",
      conclusion,
      output: {
        title: isBlocked ? "Blocked PR" : "PR Ready",
        summary,
      },
    });
  } else {
    await octokit.checks.create({
      owner,
      repo,
      name: CHECK_NAME,
      head_sha: headSha,
      status: "completed",
      conclusion,
      output: {
        title: isBlocked ? "Blocked PR" : "PR Ready",
        summary,
      },
    });
  }
}
