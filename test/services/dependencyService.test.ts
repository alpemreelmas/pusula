import { resolveDependency, removeDependencyFromDependents } from "../../src/services/dependencyService";
import { PRSummary } from "../../src/types";

const makePR = (number: number, createdAt: string, state: PRSummary["state"] = "open"): PRSummary => ({
  number,
  title: `ABC-123: pr ${number}`,
  url: `https://github.com/owner/repo/pull/${number}`,
  branch: `feature/${number}`,
  state,
  createdAt,
});

describe("resolveDependency", () => {
  const currentPR = { number: 20, createdAt: "2024-01-10T00:00:00Z" };

  it("returns null when no related PRs", () => {
    expect(resolveDependency(currentPR, [])).toBeNull();
  });

  it("returns oldest open PR that predates current", () => {
    const older = makePR(10, "2024-01-01T00:00:00Z");
    const evenOlder = makePR(5, "2023-12-01T00:00:00Z");
    const result = resolveDependency(currentPR, [older, evenOlder]);
    expect(result?.number).toBe(5);
  });

  it("ignores closed PRs", () => {
    const closed = makePR(10, "2024-01-01T00:00:00Z", "closed");
    expect(resolveDependency(currentPR, [closed])).toBeNull();
  });

  it("ignores PRs newer than current", () => {
    const newer = makePR(30, "2024-01-15T00:00:00Z");
    expect(resolveDependency(currentPR, [newer])).toBeNull();
  });
});

describe("removeDependencyFromDependents", () => {
  it("strips depends-on section from dependent PR body", async () => {
    const body = `desc\n\n<!-- pr-bot:start -->\n---\n⚠️ **Depends on**: [#5](https://github.com/o/r/pull/5)\n<!-- pr-bot:end -->`;

    let updatedBody = "";
    const octokit = {
      paginate: async () => [{ number: 10 }],
      pulls: {
        list: {},
        get: async () => ({ data: { body, number: 10 } }),
        update: async (params: { body: string }) => {
          updatedBody = params.body;
        },
      },
      issues: {
        removeLabel: async () => {},
      },
    };

    await removeDependencyFromDependents(octokit as never, "o", "r", 5);
    expect(updatedBody).not.toContain("Depends on");
  });

  it("skips PRs without a matching depends-on reference", async () => {
    const body = `desc\n\n<!-- pr-bot:start -->\n---\n⚠️ **Depends on**: [#99](https://github.com/o/r/pull/99)\n<!-- pr-bot:end -->`;

    let updateCalled = false;
    const octokit = {
      paginate: async () => [{ number: 10 }],
      pulls: {
        list: {},
        get: async () => ({ data: { body, number: 10 } }),
        update: async () => { updateCalled = true; },
      },
      issues: { removeLabel: async () => {} },
    };

    await removeDependencyFromDependents(octokit as never, "o", "r", 5);
    expect(updateCalled).toBe(false);
  });
});
