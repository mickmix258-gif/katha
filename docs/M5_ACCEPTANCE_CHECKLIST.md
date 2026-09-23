# KATHA M5 — Acceptance checklist (Emmy)

Source: `docs/M5_TASK_BRIEF.md` + `docs/KATHA-FULL-FEATURE-SPEC-EN.md` §F / §G / §8 M5  
Baseline M4: `e55ac91911f1473a405f3b84e2bfd22a631293a8` (PASS)  
M5 commit: _(fill after push — see git log)_  
Verified: _(pending)_

## Gate
- [ ] `/wallet` · `/gallery` · `/studio` · `/studio/earnings` · `/studio/images` (or equivalent) wired
- [ ] Mock image gen path usable from studio and/or play attach
- [ ] Moon wallet + ledger persist (`localStorage` keys documented in brief)
- [ ] `npm run build` passes
- [ ] Remote `main` SHA matches verify commit

## Image studio (mock)
- [ ] Prompt → mock image (SVG/canvas/deterministic URL — no real GPU API required)
- [ ] Optional style presets
- [ ] Attach to thread gallery from play (or documented hook)
- [ ] Cost moons deducted on success; insufficient-balance UX on fail
- [ ] Generated items appear in `/gallery`

## Moon wallet
- [ ] Balance display on `/wallet`
- [ ] Daily claim (~30 moons mock) once per day window
- [ ] Ledger list with types: `daily_grant`, `image_spend`, `tip_out`, `tip_in`, `purchase_mock`
- [ ] Persist `katha.wallet.v1` / `katha.ledger.v1` (or documented aliases)

## Creator tip / share
- [ ] Tip moons from creator profile and/or work detail
- [ ] Tipper balance ↓ · creator tip_in / earnings stub ↑
- [ ] Creator share % stub field on earnings UI

## Studio dashboard
- [ ] `/studio` shows impressions / starts / messages / likes / follows (seed + derived stubs OK)
- [ ] `/studio/earnings` shows earnings stub non-zero for at least one seed creator
- [ ] Thai UI chrome; English code modules

## Gallery
- [ ] `/gallery` lists mock-generated + seed images
- [ ] Filters: safe / mature (18+ rules unchanged)

## Out of scope (must stay out)
- [ ] No real Stripe / PromptPay / payment provider
- [ ] No real image GPU API keys required for happy path
- [ ] No group rooms / mod queue UI / PWA (M6)
- [ ] No competitor names · no secrets in group chat

## Emmy verify (after push)
- [ ] SHA match local === origin/main
- [ ] Routes + build spot-check
- [ ] Manual smoke: claim → generate → tip → studio numbers
- [ ] Checklist + STATUS marked PASS/FAIL

**Verdict: PENDING — Grok M5 UI shipped; awaiting Emmy verify after push**
