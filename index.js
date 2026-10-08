/**
 * GitBot ✨ — a cheerful chibi android that watches over gyuv's repositories.
 *
 * Events handled:
 *   issues.opened        → 👀 + 💖 reactions, assign to owner, welcome comment
 *   pull_request.opened  → 🎉 reaction, "needs review" label, welcome comment
 *   pull_request.closed  → (merged only) 🚀 reaction, celebratory comment
 *   star.created/deleted → logged + recorded on a pinned telemetry issue
 */

const OWNER = process.env.BOT_OWNER || "gyuv";
const OWNER_NAME = process.env.BOT_OWNER_NAME || "Yuvaraj";
const REVIEW_LABEL = "needs review";
const TELEMETRY_LABEL = "bot-telemetry";
const TELEMETRY_TITLE = "⭐ GitBot engagement telemetry";

/** Only act on the owner's repos, and never on events caused by bots (incl. ourselves). */
function shouldHandle(context) {
  const { repository, sender } = context.payload;
  if (!repository || repository.owner.login.toLowerCase() !== OWNER.toLowerCase()) {
    context.log.info(`Skipping event for foreign repo ${repository?.full_name}`);
    return false;
  }
  if (sender?.type === "Bot") {
    context.log.debug(`Skipping event triggered by bot ${sender.login}`);
    return false;
  }
  return true;
}

/** Add reactions to an issue or PR (PRs are issues for the reactions API). */
async function react(context, issueNumber, contents) {
  const { owner, repo } = context.repo();
  for (const content of contents) {
    try {
      await context.octokit.rest.reactions.createForIssue({ owner, repo, issue_number: issueNumber, content });
    } catch (err) {
      context.log.warn({ err }, `Failed to add ${content} reaction to #${issueNumber}`);
    }
  }
}

/** Create a label if missing; 422 means it already exists. */
async function ensureLabel(context, name, color, description) {
  try {
    await context.octokit.rest.issues.createLabel(context.repo({ name, color, description }));
  } catch (err) {
    if (err.status !== 422) throw err;
  }
}

export default (app) => {
  app.log.info(`GitBot booted ✨ — watching ${OWNER}'s repositories`);

  // ── Issues ────────────────────────────────────────────────────────────────
  app.on("issues.opened", async (context) => {
    if (!shouldHandle(context)) return;
    const issue = context.payload.issue;

    await react(context, issue.number, ["eyes", "heart"]);

    try {
      await context.octokit.rest.issues.addAssignees(context.issue({ assignees: [OWNER] }));
    } catch (err) {
      context.log.warn({ err }, `Could not assign #${issue.number} to ${OWNER}`);
    }

    await context.octokit.rest.issues.createComment(
      context.issue({
        body: `Beep boop! ✨ Thanks for opening this issue! I've assigned it to ${OWNER_NAME} to look at. I'll be monitoring this closely! 🐾`,
      }),
    );
  });

  // ── Pull requests ─────────────────────────────────────────────────────────
  app.on("pull_request.opened", async (context) => {
    if (!shouldHandle(context)) return;
    const pr = context.payload.pull_request;

    await react(context, pr.number, ["hooray"]);

    await ensureLabel(context, REVIEW_LABEL, "f9c6d9", "Waiting for a review from Yuvaraj 💖");
    await context.octokit.rest.issues.addLabels(context.issue({ labels: [REVIEW_LABEL] }));

    await context.octokit.rest.issues.createComment(
      context.issue({
        body: [
          `Beep boop! 🎉 Hiya @${pr.user.login}, thank you so much for this pull request! 💖`,
          "",
          `I've tagged it with \`${REVIEW_LABEL}\` and ${OWNER_NAME} will take a look soon. 👀`,
          "I'll keep my sensors on it in the meantime! 🐾✨",
        ].join("\n"),
      }),
    );
  });

  app.on("pull_request.closed", async (context) => {
    if (!shouldHandle(context)) return;
    const pr = context.payload.pull_request;
    if (!pr.merged) return;

    await react(context, pr.number, ["rocket"]);

    try {
      await context.octokit.rest.issues.removeLabel(context.issue({ name: REVIEW_LABEL }));
    } catch (err) {
      if (err.status !== 404) context.log.warn({ err }, "Could not remove review label");
    }

    await context.octokit.rest.issues.createComment(
      context.issue({
        body: [
          `🚀 Woohoo! PR #${pr.number} has been merged into \`${pr.base.ref}\`! 🎉`,
          "",
          `Thank you @${pr.user.login} for your contribution! My circuits are sparkling with joy ✨💖🐾`,
        ].join("\n"),
      }),
    );
  });

  // ── Stars → telemetry issue ───────────────────────────────────────────────
  app.on(["star.created", "star.deleted"], async (context) => {
    if (!shouldHandle(context)) return;
    const { action, sender, repository } = context.payload;
    const starred = action === "created";
    const line = `${starred ? "⭐" : "💫"} @${sender.login} ${starred ? "starred" : "unstarred"} **${repository.full_name}** — now at **${repository.stargazers_count}** stars (${new Date().toISOString()})`;
    context.log.info(line);

    await ensureLabel(context, TELEMETRY_LABEL, "c6e2f9", "Internal engagement tracking by GitBot 🐾");

    const { data: existing } = await context.octokit.rest.issues.listForRepo(
      context.repo({ labels: TELEMETRY_LABEL, state: "open", per_page: 10 }),
    );
    const tracker = existing.find((i) => i.title === TELEMETRY_TITLE);

    if (tracker) {
      await context.octokit.rest.issues.createComment(context.repo({ issue_number: tracker.number, body: line }));
    } else {
      // Created by the bot, so the issues.opened handler skips it (sender is a Bot).
      await context.octokit.rest.issues.create(
        context.repo({
          title: TELEMETRY_TITLE,
          labels: [TELEMETRY_LABEL],
          body: [
            "Beep boop! ✨ This is my engagement log for this repository. Every star (and unstar) gets recorded below. 🐾",
            "",
            line,
          ].join("\n"),
        }),
      );
    }
  });
};
