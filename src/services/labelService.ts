type Octokit = {
  issues: {
    addLabels: (params: unknown) => Promise<unknown>;
    removeLabel: (params: unknown) => Promise<unknown>;
    listLabelsForRepo: (params: unknown) => Promise<{ data: Array<{ name: string }> }>;
    createLabel: (params: unknown) => Promise<unknown>;
  };
};

const LABEL_COLORS: Record<string, string> = {
  "env-change": "e4e669",
  blocked: "d73a4a",
};

export async function ensureLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  name: string
): Promise<void> {
  const { data: labels } = await octokit.issues.listLabelsForRepo({ owner, repo });
  const exists = labels.some((l) => l.name === name);
  if (!exists) {
    await octokit.issues.createLabel({
      owner,
      repo,
      name,
      color: LABEL_COLORS[name] ?? "ededed",
    });
  }
}

export async function addLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  name: string
): Promise<void> {
  await ensureLabel(octokit, owner, repo, name);
  await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels: [name] });
}

export async function removeLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  name: string
): Promise<void> {
  try {
    await octokit.issues.removeLabel({
      owner,
      repo,
      issue_number: issueNumber,
      name,
    });
  } catch {
    // Swallow 404 if label not present
  }
}
