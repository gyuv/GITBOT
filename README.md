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

## Deploy on Render
1. On https://render.com, sign in with GitHub, then **New → Blueprint** and pick `gyuv/GITBOT`. It reads `render.yaml`.
2. When prompted, fill `WEBHOOK_SECRET` (same as in the GitHub App) and `PRIVATE_KEY` (paste the whole `.pem` file, including the BEGIN/END lines).
3. After deploy, copy the service URL (e.g. `https://gitbot-xxxx.onrender.com`) and set the GitHub App's **Webhook URL** to `https://gitbot-xxxx.onrender.com/api/github/webhooks`.
4. Check `https://gitbot-xxxx.onrender.com/ping` returns `PONG`.

The free plan sleeps after 15 minutes idle; the first webhook after a sleep may time out on GitHub's side (redeliver it from the App's **Advanced** tab), later ones are instant.

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
