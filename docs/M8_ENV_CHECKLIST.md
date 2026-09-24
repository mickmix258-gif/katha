# M8 — Boss env return checklist (names only)

Set on **Vercel → Project → Settings → Environment Variables** (Production).  
**Do not paste values into git, chat logs, or this file.**

## Required for developer studio password gate

| Name | How to set |
|------|------------|
| `DEV_STUDIO_KEY` | Generate locally: `openssl rand -hex 24`. Paste into Vercel. Use as `?key=` or `x-dev-studio-key` for `/dev/studio` and `GET /api/telemetry/events`. |

Without this **and** without OAuth, `/dev/studio` shows a Thai “not configured” page and does not expose events.

## Auth (optional but enables team-login gate + server wallet)

| Name | How to set |
|------|------------|
| `AUTH_SECRET` | `openssl rand -base64 32` → Vercel |
| `AUTH_GOOGLE_ID` | Google Cloud OAuth client id → Vercel |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret → Vercel |
| `AUTH_TWITTER_ID` | X developer portal OAuth 2.0 client id → Vercel |
| `AUTH_TWITTER_SECRET` | X OAuth 2.0 client secret → Vercel |
| `AUTH_URL` | Optional canonical site URL |
| `AUTH_TRUST_HOST` | Optional; app already uses `trustHost: true` |

## Upstash (optional — durable rate limit + wallet + telemetry ring)

| Name | How to set |
|------|------------|
| `UPSTASH_REDIS_REST_URL` | Upstash console → Redis REST URL → Vercel |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token → Vercel |

If unset: in-memory fallbacks (best-effort on multi-instance).

## Image (optional fal fallback)

| Name | How to set |
|------|------------|
| `FAL_KEY` | fal.ai API key → Vercel (server-only) |
| `IMAGE_GEN_MODEL` | Optional model id override |

## After setting vars

1. Redeploy on Vercel (parent/boss) — this milestone commit does **not** auto-redeploy.
2. Open `/dev/studio?key=…` privately; confirm dashboard counts, no public nav link.
3. Confirm public `/studio` unchanged (creator studio only).

## Public URLs (no secrets)

- Public site / creator studio: `/` · `/studio`
- Developer studio (internal): `/dev/studio`
- Ingest: `POST /api/telemetry/event`
- Read (gated): `GET /api/telemetry/events`
