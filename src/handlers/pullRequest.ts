import { Context } from "probot";
import { parseJiraKeys } from "../utils/jiraParser";
import { stripBotSection, injectBotSection } from "../utils/bodyEditor";
import { findRelatedPRs } from "../services/relatedPRService";
import { resolveDependency, removeDependencyFromDependents } from "../services/dependencyService";
import { addLabel, removeLabel } from "../services/labelService";
import { createOrUpdateCheckRun } from "../services/checkRunService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOctokit = any;

type PullRequestContext = Context<"pull_request">;

export async function handlePullRequest(context: PullRequestContext): Promise<void> {
  const { action, pull_request: pr, repository } = context.payload;
  const owner = repository.owner.login;
  const repo = repository.name;
  const octokit: AnyOctokit = context.octokit;

  if (action === "closed") {
    await removeDependencyFromDependents(octokit, owner, repo, pr.number);
    return;
  }

  // opened / edited / synchronize
  const jiraKeys = parseJiraKeys(pr.title);

  const relatedPRs = await findRelatedPRs(octokit, owner, repo, jiraKeys, pr.number);

  // Check for .env.example changes
  const files: Array<{ filename: string }> = await octokit.paginate(
    octokit.pulls.listFiles,
    { owner, repo, pull_number: pr.number, per_page: 100 }
  );
  const hasEnvChange = files.some(
    (f) => f.filename === ".env.example" || f.filename.endsWith("/.env.example")
  );

  if (hasEnvChange) {
    await addLabel(octokit, owner, repo, pr.number, "env-change");
  }

  const dependsOn = resolveDependency(
    { number: pr.number, createdAt: pr.created_at },
    relatedPRs
  );

  if (dependsOn) {
    await addLabel(octokit, owner, repo, pr.number, "blocked");
  } else {
    await removeLabel(octokit, owner, repo, pr.number, "blocked");
  }

  const cleanBody = stripBotSection(pr.body ?? "");
  const newBody = injectBotSection(cleanBody, { relatedPRs, dependsOn, hasEnvChange });

  await octokit.pulls.update({ owner, repo, pull_number: pr.number, body: newBody });

  await createOrUpdateCheckRun(octokit, owner, repo, pr.head.sha, dependsOn !== null);
}
