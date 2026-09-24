# M7 — Pre-share security PASS

Emmy lock: Vercel is the control plane. Browser calls **only** our APIs. No provider keys in client. Moons for logged-in users are stored and deducted **server-side**. Adult 18+ OK.

## PASS checklist

| Requirement | Status | Notes |
|-------------|--------|--------|
| Browser never calls Pollinations/fal directly | PASS | Only `POST /api/images/generate` (server) builds Pollinations URL / uses `FAL_KEY` |
| No key/token in HTML/JS/public responses/logs | PASS | `FAL_KEY` and OAuth secrets via `process.env` only; logs never print keys |
| Image gen rate limit per IP | PASS | **5 / minute** and **30 / hour** per IP; HTTP **429** + Thai `messageTh`; `Retry-After` header; **must not charge moons** |
| Dangerous APIs cannot forge moon grants | PASS (when auth on) | No public “add moons” API; mock top-up hidden in server mode; only `POST /api/wallet/daily-claim` grants |
| Unauthenticated abuse blocked | PASS | Rate limit always; when auth configured, image gen + wallet mutate require session (401) |
| Security headers | PASS | `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`, Permissions-Policy; CORS not wide open (cross-origin API POSTs rejected) |
| Google + X login | CODE READY | Needs Vercel env (see below) |
| Server moons for logged-in users | PASS (when auth on) | Upstash Redis if set; else in-memory Map by user id |
| Main paths build | See CI / `npm run build` | home, characters, play, studio/images, gallery, wallet, login |

## Rate limits

Constants in `src/lib/wallet-constants.ts`:

- `IMAGE_GEN_RATE_LIMIT_PER_MINUTE = 5`
- `IMAGE_GEN_RATE_LIMIT_PER_HOUR = 30`

Storage:

1. **Preferred:** Upstash Redis via `@upstash/ratelimit` when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set.
2. **Fallback:** in-memory `Map` — **best-effort only** on multi-instance / serverless (each isolate has its own map). Documented residual risk.

429 response shape:

```json
{ "ok": false, "reason": "rate_limited", "messageTh": "…", "retryAfterSec": N, "charged": false }
```

## Auth (Auth.js / NextAuth v5)

Routes: `/api/auth/[...nextauth]`, UI `/login` (header link).

### Env vars (boss sets on Vercel via DM — do not invent values)

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Session signing. Generate: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client id |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_TWITTER_ID` | X (Twitter) OAuth 2.0 client id |
| `AUTH_TWITTER_SECRET` | X OAuth 2.0 client secret |
| `AUTH_URL` | Optional canonical URL |
| `AUTH_TRUST_HOST` | Optional; code sets `trustHost: true` |

Optional image / wallet durability:

| Variable | Purpose |
|----------|---------|
| `FAL_KEY` | Optional fal.ai fallback (server-only) |
| `IMAGE_GEN_MODEL` | Optional fal model id |
| `UPSTASH_REDIS_REST_URL` | Rate limit + server wallet |
| `UPSTASH_REDIS_REST_TOKEN` | Same |

**Pragmatic split:** App **builds and runs** without OAuth env. `/login` shows Thai message that OAuth is not configured. Image gen still works with rate limit; moons stay on client localStorage until auth is configured.

When auth **is** configured:

- `POST /api/images/generate` requires session; deducts `IMAGE_COST` (10) **only after** provider success
- `GET /api/wallet`, `POST /api/wallet/daily-claim` require session
- Starting balance / daily grant: same constants as before (`STARTING_BALANCE=50`, `DAILY_GRANT_FREE=30`, `DAILY_GRANT_PLUS=300`)

## Architecture

```
Browser → /api/images/generate → Pollinations (free) → optional fal (FAL_KEY)
                ↓
         rate limit (IP)
                ↓
         session + server wallet deduct (if auth configured)
```

## Known limits / residual risks (Emmy FAIL review)

1. **In-memory rate limit / wallet** without Upstash: not shared across Vercel instances; cold start resets memory wallet.
2. **Tips (`tip-moons`)** still use client localStorage — not part of server wallet yet.
3. **Guest / auth-off mode:** local moons can be edited in DevTools; mitigated by IP rate limit on image gen. Enable OAuth + Upstash for production share.
4. **OAuth env missing:** login disabled until boss sets secrets; code paths are complete.
5. **CSP** allows `unsafe-inline` / `unsafe-eval` scripts for Next.js + Tailwind pragmatism — tighten later if needed.

## Secret scan notes

- Grep client bundles after build: no `FAL_KEY` value, no OAuth secrets.
- Pollinations URL construction lives only in `src/app/api/images/generate/route.ts`.

## SFW image policy (Emmy lock)

Image generation is **SFW-only** (max = swimsuit/bikini sexy; no nudity). See `docs/M7_SFW_IMAGE_POLICY.md`.

- Pollinations: `safe=true`
- fal: `enable_safety_checker: true`
- Prompt gate: `src/lib/media/sfw-gate.ts` → HTTP 422 `sfw_blocked`, `charged: false`
