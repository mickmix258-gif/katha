# KATHA M6 — Acceptance checklist (Emmy)

Source: `docs/M6_TASK_BRIEF.md` + `docs/KATHA-FULL-FEATURE-SPEC-EN.md` §E group / §I Moderation / §J PWA / §8 M6  
Baseline M5: `251eb402af40d00c51f019d20381f1ba2fe5807d` (PASS)  
M6 commit: `a323ade2549e48d8077dd23f9bfa8ee5f32f7a9a`  
Verified: _(Emmy)_

## Gate
- [ ] `/play/group` · `/room/[threadId]` · `/studio/moderation` · `/notifications` · `/settings` wired (no Coming stubs)
- [ ] PWA: `/manifest.webmanifest` + `/sw.js` offline shell registered
- [ ] `npm run build` passes
- [ ] Remote `main` SHA matches M6 commit

## Group play
- [ ] Create room 2–4 seats + 1 character OR 1 scene (`katha.groupRooms.v1`)
- [ ] Join / leave mock seats; invite code; turn-order stub advances after send
- [ ] Reuses Play chrome (`PlayRoom` mode `group`); `/room/[threadId]` alias
- [ ] Inner monologue disabled in group unless all seats opt in
- [ ] Entry from character/scene detail → 「ห้องกลุ่ม」

## Moderation
- [ ] Public publish enqueues AI pre-mod stub (approve / decline / needs_review)
- [ ] `/studio/moderation` admin queue: approve / decline / needs_review + reject reasons
- [ ] Report button on character/scene detail → report job in queue
- [ ] Declined works not in public catalog; owner can still open detail
- [ ] Hidden `systemInstruction` still never shown to public chrome

## Notifications
- [ ] `/notifications` lists follow / like / tip / moderation / creator_share / report
- [ ] Mark one / mark all read; persist `katha.notifications.v1`

## Settings + PWA
- [ ] `/settings`: age 18+ verify + contentMode all/safe_only + autoModerate toggle (`katha.settings.v1`)
- [ ] Manifest + icons + service worker offline shell (navigations fall back to `/`)

## Out of scope (must stay out)
- [ ] No real payment PSP / GPU image API
- [ ] No multi-device sync server / Telegram bot
- [ ] No competitor names · no secrets in group chat

## Emmy verify
- [ ] SHA match
- [ ] Routes + build spot-check
- [ ] Smoke: create group → send turn · publish → mod queue · follow/like/tip → notifications · settings
- [ ] Checklist marked PASS

**Verdict: _(pending Emmy)_**
