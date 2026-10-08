# GitBot ✨🐾

A cheerful chibi android GitHub App (Probot) that watches over **gyuv**'s repositories.

![GitBot](image_0.png)

## What it does
| Event | Action |
|---|---|
| Issue opened | 👀 + 💖 reactions, assigns `gyuv`, friendly comment |
| PR opened | 🎉 reaction, `needs review` label, welcome comment |
| PR merged | 🚀 reaction, removes `needs review`, celebration comment |
| Repo starred/unstarred | Logged + appended to a `bot-telemetry` issue |

Events from other owners' repos and from bots (including itself) are ignored.

## Run
```bash
npm install
cp .env.example .env   # fill APP_ID, WEBHOOK_SECRET, PRIVATE_KEY_PATH (and WEBHOOK_PROXY_URL from smee.io for local dev)
npm start
```

## GitHub App settings
**Repository permissions**
- Issues: **Read & write** (reactions, assignees, comments, labels, telemetry issue)
- Pull requests: **Read & write** (reactions/labels/comments on PRs)
- Metadata: **Read-only** (mandatory; required for the Star event)

**Subscribe to events:** Issues, Pull request, Star

Install it with "Only on this account" on `gyuv`, all repositories.

## Profile README status
1. In the `gyuv/gyuv` profile repo, add to `README.md`:
   ```
   <!-- bot-status -->
   <!-- /bot-status -->
   ```
2. Copy `profile/profile-updater.js` to that repo's root and `profile/.github/workflows/update-readme.yml` to its `.github/workflows/`.
3. Set the repository variable `BOT_LOGIN` to `<your-app-slug>[bot]`.

The workflow runs hourly, finds the bot's newest comment across your 30 most recently pushed public repos, and rewrites the status line.
