import { Probot } from "probot";
import { handlePullRequest } from "./handlers/pullRequest";

export default (app: Probot): void => {
  app.on(
    ["pull_request.opened", "pull_request.edited", "pull_request.synchronize", "pull_request.closed"],
    handlePullRequest
  );

  app.log.info("PR Intelligence Bot started");
};
