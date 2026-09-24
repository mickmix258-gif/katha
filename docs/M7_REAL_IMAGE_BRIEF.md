# M7 — Real image generation (fal.ai)

Emmy-locked: studio generate must use a real fal.ai model when configured. Never silently fall back to SVG mock.

## Env (server only)

| Variable | Required | Notes |
|----------|----------|--------|
| `FAL_KEY` | Yes for happy path | fal.ai API key. Server-only (`process.env`). Never put in client bundle or commit. |
| `IMAGE_GEN_MODEL` | No | Default: `fal-ai/flux/dev`. Override to another fal text-to-image endpoint. |

### Vercel

1. Project → Settings → Environment Variables
2. Add `FAL_KEY` = your key (Production / Preview as needed)
3. Optionally add `IMAGE_GEN_MODEL` (e.g. `fal-ai/flux/dev`)
4. Redeploy

Local: put the same vars in `.env.local` (gitignored). Without `FAL_KEY`, `POST /api/images/generate` returns `503` with Thai `no_provider` — the studio shows that error and does **not** create a mock image or charge moons.

## Behavior

- Cost: **10 moons** (`IMAGE_COST`), deducted only after successful generation
- SFW lock: `rating` ignored/forced safe; Pollinations `safe=true`; fal `enable_safety_checker: true`; see `docs/M7_SFW_IMAGE_POLICY.md`
- Seed gallery SVG placeholders remain (source `seed`) and are not claimed as model output
- API: `POST /api/images/generate` → `{ ok, imageUrl, seed?, model }` or `{ ok:false, reason, messageTh }`

## Client

- `generateImage` in `src/lib/media/image-store.ts` (async)
- Used by Image Studio + play `/image` slash + play attach panel
