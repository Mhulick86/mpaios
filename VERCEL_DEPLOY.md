# Deploying mpaios to Vercel

This is the lane-A+B deploy: Quick Actions dashboard + `/api/*`
serverless functions on Vercel, with *optional* LM Studio access via
a tunnel. Without a tunnel the orchestrator runs cloud-only; with one,
the local model is consulted for planning and gets `check-citations`
by default.

## Prereqs

- A Vercel account and the project pushed to GitHub (or a local repo
  ready for `vercel link`).
- At least one of: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
  `GOOGLE_API_KEY`. The orchestrator errors out only if *none* are
  set and no LM Studio tunnel is configured.
- Optional (lane B): a way to tunnel `http://localhost:1234/v1`
  publicly — `cloudflared`, `ngrok`, or a WireGuard/Tailscale relay.

## Step 1 — Link the project

```bash
pnpm dlx vercel link
```

Answer the prompts; it writes `.vercel/project.json`. Do NOT commit
that file — the existing `.gitignore` already covers `.vercel/` if
Vercel adds it; check before the first push.

## Step 2 — Set production environment variables

**Auth — required.** Without `JWT_SECRET` the sign-up / log-in
endpoints crash on the first request.

```bash
# generate a 48-byte random secret and set it
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))" \
  | pnpm dlx vercel env add JWT_SECRET production
```

**User store — required for production.** The default file-backed
store only works in local dev (Vercel's filesystem is read-only).
Attach a Redis/KV integration from the Vercel Marketplace:

1. Vercel dashboard → your project → **Storage** tab.
2. Click **Create Database** → pick **Upstash Redis** (free tier).
3. Accept the defaults; Vercel auto-populates `KV_URL`,
   `KV_REST_API_URL`, and `KV_REST_API_TOKEN` for you.
4. Redeploy so the new envs are picked up.

**Provider keys — at least one.**

```bash
pnpm dlx vercel env add ANTHROPIC_API_KEY production
pnpm dlx vercel env add OPENAI_API_KEY    production
pnpm dlx vercel env add GOOGLE_API_KEY    production
```

Each command opens an input prompt — paste the key, hit Enter.

## Step 3 (optional, lane B) — Tunnel LM Studio

Run this on the machine where LM Studio is running:

```bash
# Cloudflare Tunnel (quickest, no account needed for an ephemeral URL)
cloudflared tunnel --url http://localhost:1234
# Copy the printed https://<id>.trycloudflare.com URL.

# Or ngrok
ngrok http 1234
```

Then register the URL on Vercel, making sure to include the
OpenAI-compat suffix `/v1`:

```bash
pnpm dlx vercel env add LMSTUDIO_BASE_URL production
# Paste: https://<id>.trycloudflare.com/v1
```

Pin a specific model if you want deterministic routing:

```bash
pnpm dlx vercel env add LMSTUDIO_MODEL production
# Paste: qwen2.5-7b-instruct (or whatever is loaded in LM Studio)
```

> **Gotcha:** the tunnel is only live while your machine is on. If
> the tunnel goes away the orchestrator falls back to each action's
> `cloudFallback` — so `check-citations` quietly routes to OpenAI and
> the planner skips its rewrite step. No 500s.

## Step 4 — Deploy

```bash
pnpm dlx vercel --prod
```

Vercel runs `vercel-build` (compiles the skills index), detects the
`api/*` and `api/quick-actions/*` TypeScript files as Node functions,
and serves `public/` statically. `vercel.json` caps each function at
10 seconds.

Smoke-test with the printed URL:

```bash
curl -s https://<your-deploy>.vercel.app/api/quick-actions/review-generation \
  -H "content-type: application/json" \
  -d '{"businessName":"Acme","voice":"warm","businessContact":"hello@acme.com","review":{"reviewerName":"Priya","stars":2,"text":"Wait was too long."}}' \
  | jq
```

You should see `{ plan: { specialist: ..., model: ... }, output: "Hi Priya, ..." }`.

## Behavior matrix

| Env you set | Planner | Default specialist runs | On specialist error |
|---|---|---|---|
| Only cloud keys | Skipped (no local) | Uses action's declared default if its key is present, else `cloudFallback` | Fall through to `cloudFallback`; if that fails and no local, rethrow |
| Cloud keys + `LMSTUDIO_BASE_URL` (tunnel) | LM Studio re-plans each request | Planner output if it has a key | `cloudFallback`, then `local` |
| Only `LMSTUDIO_BASE_URL` | LM Studio plans | `local` for everything | Rethrow (no cloud available) |
| Nothing | n/a | Errors 500: "no providers available" | — |

## Continuous deploys

Connect the GitHub repo in the Vercel dashboard. Every push to the
default branch deploys to production; other branches get preview
URLs. The current work is on `claude/integrate-openclaw-2Kszm` — set
that as the production branch or merge to `main` first.

## Rollback

```bash
pnpm dlx vercel rollback
```

Picks from the most recent deploys. The UI's console shows the git
SHA, so you can match against the commit log.

## What this deploy is NOT

- It does **not** run the openclaw WhatsApp/Telegram gateway. That's
  a long-lived process (Baileys socket, session store) and doesn't
  fit Vercel's 10-second function cap. For the gateway, run
  `MPAIOS_BOOT=1 node dist/src/boot.js` on your own box or a VPS.
- It does not ship with the `src/index.ts` demo script — that is
  local-dev only. Production traffic only hits `api/**`.
