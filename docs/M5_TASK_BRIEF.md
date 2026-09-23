# KATHA Milestone 5 — Media + wallet + studio (Emmy × Grok)

Source: `docs/KATHA-FULL-FEATURE-SPEC-EN.md` § F Media, § G Social/economy, §8 M5.
Baseline: `main` @ `e55ac91911f1473a405f3b84e2bfd22a631293a8` (M4 PASS).

Do **M5 only**. No group rooms / real mod queue / PWA (M6). No real payment provider.

## Goal
Ship mock image generation, Moon wallet + ledger, creator tip/share, and studio dashboard so creators can see stats and earnings stubs.

## In scope
1. **Image studio (mock)**
   - From play thread and/or `/studio/images`: prompt → mock image (placeholder SVG/canvas or deterministic art URL)
   - Attach to thread gallery; optional style presets
   - Cost moons (deduct from mock wallet) with failed-balance UX
2. **Moon wallet**
   - `/wallet` page: balance, daily claim (30 moons mock), ledger list
   - Transaction types: daily_grant, image_spend, tip_out, tip_in, purchase_mock
   - Persist in localStorage (`katha.wallet.v1` / `katha.ledger.v1`)
3. **Creator share / tip**
   - Tip moons to creator from profile or work detail
   - Creator share % stub field on earnings
4. **Studio dashboard**
   - `/studio` + `/studio/earnings`: impressions, starts, messages, likes, follows, earnings (seed + derived from local social/play where possible)
5. **Gallery**
   - `/gallery` lists mock-generated + seed images with filters (safe/mature)
6. Thai UI; English code; no competitor names; 18+ content rules unchanged

## Out of scope
- Real Stripe/PromptPay, real GPU image API, group rooms, push notifs, PWA

## Acceptance
1. Claim daily moons · balance updates · ledger row appears
2. Generate mock image · moons deducted · appears in gallery + optional thread attach
3. Tip creator · both ledgers/balances update
4. Studio dashboard shows non-zero stub/derived stats for seed creator
5. `npm run build` passes
6. Docs checklist ready for Emmy; no secrets in group chat

## Split
- **Grok:** wallet/ledger store, image mock, gallery, studio UI, tip flows, play attach hook
- **Emmy:** acceptance checklist + verify after push
