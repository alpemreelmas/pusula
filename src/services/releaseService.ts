const BOT_SECTION_REGEX = /<!-- pr-bot:start -->([\s\S]*?)<!-- pr-bot:end -->/;

type Octokit = {
  pulls: {
    get: (params: unknown) => Promise<{
      data: { number: number; title: string; html_url: string; body: string | null };
    }>;
  };
};

export async function generateReleaseSummary(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumbers: number[]
): Promise<string> {
  const lines: string[] = [
    "# Release Summary",
    "",
    `PRs included: ${prNumbers.map((n) => `#${n}`).join(", ")}`,
    "",
  ];

  for (const num of prNumbers) {
    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: num });
    const body = pr.body ?? "";
    const match = body.match(BOT_SECTION_REGEX);
    const botContent = match ? match[1].trim() : "_No bot section_";

    lines.push(`## [#${num}](${pr.html_url}) — ${pr.title}`);
    lines.push("");
    lines.push(botContent);
    lines.push("");
  }

  return lines.join("\n");
}
