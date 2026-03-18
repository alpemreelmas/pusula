import { handlePullRequest } from "../../src/handlers/pullRequest";

function makeContext(overrides: Record<string, unknown> = {}) {
  const pr = {
    number: 1,
    title: "ABC-123: fix login",
    body: "my description",
    head: { sha: "abc123", ref: "feature/abc-123" },
    created_at: "2024-06-01T00:00:00Z",
    state: "open",
    ...((overrides.pull_request as object) ?? {}),
  };

  const updatedBodies: string[] = [];
  const addedLabels: string[] = [];

  const octokit = {
    paginate: async (_fn: unknown, _params: unknown): Promise<unknown[]> => {
      return [];
    },
    pulls: {
      list: {},
      listFiles: {},
      update: async (params: { body: string }) => {
        updatedBodies.push(params.body);
      },
    },
    issues: {
      addLabels: async (params: { labels: string[] }) => {
        addedLabels.push(...params.labels);
      },
      removeLabel: async () => {},
      listLabelsForRepo: async () => ({ data: [] }),
      createLabel: async () => {},
    },
    checks: {
      listForRef: async () => ({ data: { check_runs: [] } }),
      create: async () => ({ data: { id: 1 } }),
      update: async () => {},
    },
  };

  return {
    payload: {
      action: overrides.action ?? "opened",
      pull_request: pr,
      repository: { owner: { login: "owner" }, name: "repo" },
    },
    octokit,
    _updatedBodies: updatedBodies,
    _addedLabels: addedLabels,
  };
}

describe("handlePullRequest", () => {
  it("injects bot section into PR body on open", async () => {
    const ctx = makeContext();
    await handlePullRequest(ctx as never);
    expect(ctx._updatedBodies[0]).toContain("<!-- pr-bot:start -->");
    expect(ctx._updatedBodies[0]).toContain("<!-- pr-bot:end -->");
  });

  it("does not crash when PR body is null", async () => {
    const ctx = makeContext({ pull_request: { body: null } });
    await expect(handlePullRequest(ctx as never)).resolves.not.toThrow();
  });

  it("calls removeDependencyFromDependents on close", async () => {
    const ctx = makeContext({ action: "closed" });
    // No update should happen on the PR itself for closed action
    await handlePullRequest(ctx as never);
    expect(ctx._updatedBodies).toHaveLength(0);
  });

  it("adds env-change label when .env.example is in changed files", async () => {
    const ctx = makeContext();
    (ctx.octokit as { paginate: (_fn: unknown, _params: unknown) => Promise<unknown[]> }).paginate =
      async (_fn: unknown, params: unknown) => {
        const p = params as Record<string, unknown>;
        if ("pull_number" in p) return [{ filename: ".env.example" }];
        return [];
      };
    await handlePullRequest(ctx as never);
    expect(ctx._addedLabels).toContain("env-change");
  });
});
