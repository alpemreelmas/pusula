import { findRelatedPRs } from "../../src/services/relatedPRService";

function makeOctokit(prs: unknown[]) {
  return {
    paginate: async () => prs,
    pulls: { list: {} },
  };
}

const basePR = {
  number: 10,
  title: "ABC-123: something",
  html_url: "https://github.com/owner/repo/pull/10",
  head: { ref: "feature/abc-123" },
  state: "open",
  merged_at: null,
  created_at: "2024-01-01T00:00:00Z",
};

describe("findRelatedPRs", () => {
  it("returns empty array when no JIRA keys", async () => {
    const octokit = makeOctokit([basePR]);
    const result = await findRelatedPRs(octokit, "owner", "repo", [], 99);
    expect(result).toEqual([]);
  });

  it("finds PRs sharing JIRA key", async () => {
    const octokit = makeOctokit([basePR]);
    const result = await findRelatedPRs(octokit, "owner", "repo", ["ABC-123"], 99);
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(10);
  });

  it("excludes current PR by number", async () => {
    const octokit = makeOctokit([basePR]);
    const result = await findRelatedPRs(octokit, "owner", "repo", ["ABC-123"], 10);
    expect(result).toHaveLength(0);
  });

  it("does not match PRs without the JIRA key", async () => {
    const other = { ...basePR, number: 11, title: "DEF-999: unrelated" };
    const octokit = makeOctokit([basePR, other]);
    const result = await findRelatedPRs(octokit, "owner", "repo", ["ABC-123"], 99);
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(10);
  });

  it("builds correct URL", async () => {
    const octokit = makeOctokit([basePR]);
    const result = await findRelatedPRs(octokit, "owner", "repo", ["ABC-123"], 99);
    expect(result[0].url).toBe("https://github.com/owner/repo/pull/10");
  });

  it("matches any of multiple JIRA keys", async () => {
    const pr2 = { ...basePR, number: 20, title: "XYZ-999: other" };
    const octokit = makeOctokit([basePR, pr2]);
    const result = await findRelatedPRs(octokit, "owner", "repo", ["ABC-123", "XYZ-999"], 99);
    expect(result).toHaveLength(2);
  });
});
