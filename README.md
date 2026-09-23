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

### M3
- Create hub `/create` → quick character, full character, world, scene editors
- Quick create: name + prompt → heuristic draft fill; refine; save draft / publish
- Full character: all M3 fields, scenarios (บทเปิด), hidden `systemInstruction` with owner/collaborators/nobody visibility (never shown on public detail)
- World + scene editors with residents / NPCs / WorldCards + collaborators stub (≤5)
- Publish flow: draft → published / pending-moderation stub; works merge into explore via `localStorage` (`katha.userWorks.v1`)
- Age gate: characters must be 18+; no underage fields

### M4
- Play routes: `/play/character/[id]`, `/play/scene/[id]`, `/play/world/[id]`, `/play/thread/[threadId]`
- Thread store in `localStorage` (`katha.threads.v1`): messages, branches, settings, memory cards, last-read
- Mock LLM stream adapter (`src/lib/play/llm-adapter.ts`) — swap via `setLlmAdapter` for a real provider
- Stream UI with abort; regenerate / edit / delete / branch
- LoreEngine + MemoryCards + slash `/reset` `/summary` `/memory` `/note` (`/image` stub)
- Inner monologue toggle + persona selector; export markdown
- Context assembly order per spec § E (dev context panel)
- No group mode (M6)

## Specs

- `docs/KATHA-FULL-FEATURE-SPEC-EN.md` — source of truth
- `docs/M4_TASK_BRIEF.md` — M4 acceptance
- `docs/M4_ACCEPTANCE_CHECKLIST.md` — checklist for Emmy
- `src/locales/th.json` — visible Thai copy

### M5
- Moon wallet + ledger, mock image studio, gallery, tip, creator studio dashboard

### M6
- Group rooms (`/play/group`, `/room/[threadId]`) 2–4 seats + character/scene
- Moderation stub queue `/studio/moderation` + report flows + AI verdict mock
- Notifications center; settings age/content mode; PWA manifest + offline shell SW

## Out of scope (do not start here)

Real payment PSP, real GPU, multi-device sync server, Telegram bot.
