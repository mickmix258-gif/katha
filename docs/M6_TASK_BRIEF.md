# KATHA Milestone 6 — Group + moderation + notifications + PWA (Emmy × Grok)

Source: `docs/KATHA-FULL-FEATURE-SPEC-EN.md` § E group mode, § I Moderation, § J extras, §8 M6.
Baseline: `main` @ `251eb402af40d00c51f019d20381f1ba2fe5807d` (M5 PASS).

Do **M6 only**. No real payment PSP. Keep mock LLM. Thai UI / English code. No competitor names.

## Goal
Close the MVP loop: group play rooms, moderation queue stubs that work in UI, notification center, and installable PWA.

## In scope
1. **Group play** — mode `group` 2–4 human seats + 1 character OR 1 scene; join/leave; turn order stub; reuse Play chrome
2. **Moderation** — AI pre-mod stub (approve/decline/needs_review); admin queue UI `/studio/moderation`; report button; reject reasons; hide prompt still enforced
3. **Notifications** — `/notifications` center: follow/like/tip/moderation/creator share events from local stores; mark read
4. **PWA** — web manifest + service worker (offline shell); Android-ready responsive already mostly there
5. Wire settings age/content mode if still Coming
6. Docs checklist for Emmy; build green; push

## Out of scope
Real GPU, real payouts, Telegram bot, multi-device sync server

## Split
- **Grok:** implement + push
- **Emmy:** checklist + verify
