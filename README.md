# KATHA (กถา)

Thai-first original AI roleplay platform. Dark ink + cinnabar theme.

## Run

```bash
cd katha
npm install
npm run dev
```

Open http://localhost:3000

## Milestone status

### M1
- App shell, dark theme, home three surfaces, markets, explore, creator profiles
- Seed catalog: 8 characters (all 18+), 4 scenes, 2 worlds
- Prisma schema present; UI still reads `src/data/catalog.ts`

### M2
- Shared catalog filters via URL: multi-tag, rating, contentMode, time window, sort, sections
- Explore + characters / scenes / worlds use the same filter pipeline
- Like / save / dislike / follow persisted in `localStorage` (`katha.social.v1`) until DB social graph is wired
- Disliked works are downranked on default browse

### M3 (current)
- Create hub `/create` → quick character, full character, world, scene editors
- Quick create: name + prompt → heuristic draft fill; refine; save draft / publish
- Full character: all M3 fields, scenarios (บทเปิด), hidden `systemInstruction` with owner/collaborators/nobody visibility (never shown on public detail)
- World + scene editors with residents / NPCs / WorldCards + collaborators stub (≤5)
- Publish flow: draft → published / pending-moderation stub; works merge into explore via `localStorage` (`katha.userWorks.v1`)
- Sandbox preview is a non-LLM stub (M4)
- Age gate: characters must be 18+; no underage fields

## Specs

- `docs/KATHA-FULL-FEATURE-SPEC-EN.md` — source of truth
- `docs/M3_TASK_BRIEF.md` — M3 acceptance
- `docs/M3_ACCEPTANCE_CHECKLIST.md` — checklist
- `src/locales/th.json` — visible Thai copy

## Out of scope (do not start here)

Play-room chat / LLM stream (M4), payments, real moderation queue.
