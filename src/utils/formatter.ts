import { BotSections, PRSummary } from "../types";

function prLink(pr: PRSummary): string {
  return `[#${pr.number}](${pr.url})`;
}

function stateLabel(state: PRSummary["state"]): string {
  switch (state) {
    case "open":
      return "OPEN";
    case "merged":
      return "MERGED";
    case "closed":
      return "CLOSED";
  }
}

export function renderBotSection(sections: BotSections): string {
  const lines: string[] = ["---"];

  if (sections.relatedPRs.length > 0) {
    lines.push("🤖 **Related PRs** (auto-generated):");
    for (const pr of sections.relatedPRs) {
      lines.push(`- ${prLink(pr)} (${pr.branch}) — ${stateLabel(pr.state)}`);
    }
  }

  if (sections.dependsOn) {
    lines.push("");
    lines.push(`⚠️ **Depends on**: ${prLink(sections.dependsOn)}`);
  }

  if (sections.hasEnvChange) {
    lines.push("");
    lines.push("⚠️ **Risk**: Contains `.env.example` changes");
  }

  return lines.join("\n");
}
