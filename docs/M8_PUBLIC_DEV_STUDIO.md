# M8 — Public studio vs Developer studio + session telemetry

Emmy lock: public must **not** show developer mode, developer studio links, or raw telemetry UI. Telemetry from the public web stores **only** coarse fields.

## Split

| Surface | URL | Audience |
|---------|-----|----------|
| **Public creator studio** | `/studio` (and `/studio/*`) | End users / creators — existing production flows |
| **Developer studio** | `/dev/studio` | Internal only — receives aggregated session/usage events from the public web |

They are **not** the same entry. There is **no** public nav/footer link to `/dev/studio`. Document the URL internally only.

## Gate (developer studio)

Unauthenticated visitors **cannot** see events.

Access when:

1. Env `DEV_STUDIO_KEY` is set **and** the request supplies the same value via `?key=` **or** header `x-dev-studio-key`, **or**
2. Auth/OAuth is configured **and** the visitor has a valid **team login** session.

If `DEV_STUDIO_KEY` is unset **and** auth is not usable: Thai page explaining the key is not configured — **no raw events** exposed.

API: `GET /api/telemetry/events` uses the same gate.

## Telemetry flow

```
Public pages (layout TelemetryBeacon + image-store)
        │  fire-and-forget POST
        ▼
POST /api/telemetry/event  ──rate-limit per IP (IP discarded)──▶
        │
        ▼
Storage: Upstash Redis list (if UPSTASH_*) else in-memory ring (~1000)
        │
        ▼
GET /api/telemetry/events  ◀── gated ──  /dev/studio dashboard
```

### Allowed stored fields (PASS)

- `type` — e.g. `page_view`, `studio_open`, `login_view`, `wallet_open`, `image_generate_ok`, `image_generate_fail`
- `path` — route only (query/hash stripped)
- `sessionId` — coarse opaque client id (short), **not** an auth token
- `client` — coarse `{ device, os, browser }` parsed from UA (**raw UA discarded**)
- `meta` — reason codes, `promptLength`, small enums/flags only
- `ts`, `id`

### Forbidden in storage (FAIL if present)

- Raw IP
- Full User-Agent string
- Chat text / prompts / message bodies
- Keys, tokens, passwords, cookies
- Full moon balances of others

IP is used **only** for light rate-limiting on ingest (~60/min) and never written into the event.

## Client beacons

- `TelemetryBeacon` in root layout: `page_view` + route-specific (`studio_open`, `login_view`, `wallet_open`). Skips `/dev/*`.
- `generateImage` in `image-store`: `image_generate_ok` / `image_generate_fail` with `promptLength` + reason — **never** the prompt string.

Errors on ingest are ignored client-side (fire-and-forget).

## Env

See `docs/M8_ENV_CHECKLIST.md`. Names only: `DEV_STUDIO_KEY`, optional `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, existing auth and `FAL_KEY`.

## Residual risks

- In-memory ring is **per serverless isolate** — incomplete across instances until Upstash is set.
- Team-session gate allows any logged-in user when OAuth is on; prefer a strong `DEV_STUDIO_KEY` and keep the URL private.
- `?key=` in the URL can leak via Referer/history — dashboard prefers `x-dev-studio-key` header after first load; avoid sharing keyed URLs.
