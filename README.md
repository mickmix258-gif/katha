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

### M2 (current)
- Shared catalog filters via URL: multi-tag, rating, contentMode, time window, sort, sections
- Explore + characters / scenes / worlds use the same filter pipeline
- Like / save / dislike / follow persisted in `localStorage` (`katha.social.v1`) until DB social graph is wired
- Disliked works are downranked on default browse

## Specs

- `docs/KATHA-FULL-FEATURE-SPEC-EN.md` — source of truth
- `docs/M2_TASK_BRIEF.md` — M2 acceptance
- `src/locales/th.json` — visible Thai copy

## Out of scope (do not start here)

Create wizards beyond stubs, play-room chat (M4), payments.
