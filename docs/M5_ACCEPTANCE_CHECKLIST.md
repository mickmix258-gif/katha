# KATHA M5 — Acceptance checklist (Emmy)

Source: `docs/M5_TASK_BRIEF.md` + `docs/KATHA-FULL-FEATURE-SPEC-EN.md` §F / §G / §8 M5  
Baseline M4: `e55ac91911f1473a405f3b84e2bfd22a631293a8` (PASS)  
M5 commit: `ae9ecb921790b05f081f47b7322a9e4380683453` · docs SHA: `2661a696b5ed3d252455cea0df0d062479443e6b`  
Verified: 2026-09-23 · local === origin/main · `npm run build` PASS

## Gate
- [x] `/wallet` · `/gallery` · `/studio` · `/studio/earnings` · `/studio/images` wired
- [x] Mock image gen path usable from studio and play attach (`ImageStudio` in play-room)
- [x] Moon wallet + ledger persist (`katha.wallet.v1` / `katha.ledger.v1`)
- [x] `npm run build` passes
- [x] Remote `main` SHA matches `2661a696b5ed3d252455cea0df0d062479443e6b`

## Image studio (mock)
- [x] Prompt → mock image (no real GPU API)
- [x] Optional style presets
- [x] Attach to thread gallery from play
- [x] Cost moons deducted (`IMAGE_COST=10`); insufficient-balance UX
- [x] Generated items appear in `/gallery`

## Moon wallet
- [x] Balance display on `/wallet`
- [x] Daily claim (~30 moons free) once per day window
- [x] Ledger types: `daily_grant`, `image_spend`, `tip_out`, `tip_in`, `purchase_mock`

## Creator tip / share
- [x] Tip moons from `/c/[handle]` via `TipMoons`
- [x] Tipper balance ↓ · creator tip_in / earnings stub ↑
- [x] Creator share % stub on `/studio/earnings`

## Studio dashboard
- [x] `/studio` impressions / starts / messages / likes / follows stubs
- [x] `/studio/earnings` non-zero earnings path for seed creator
- [x] Thai UI chrome; English code modules

## Gallery
- [x] `/gallery` lists mock-generated + seed images
- [x] Filters: safe / mature (18+ rules unchanged)

## Out of scope (must stay out)
- [x] No real Stripe / PromptPay (mock-only note on wallet)
- [x] No real image GPU API required for happy path
- [x] No group rooms / mod queue UI / PWA (M6)
- [x] No competitor names · no secrets in group chat

## Emmy verify
- [x] SHA match
- [x] Routes + build spot-check
- [x] Smoke path: claim → generate → tip → studio numbers (code-level)
- [x] Checklist marked PASS

**Verdict: M5 PASS — Media + wallet + studio gate closed; next on boss order**
