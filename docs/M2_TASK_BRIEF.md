# KATHA Milestone 2 — Task brief (Emmy × Grok)

Source of truth: `docs/KATHA-FULL-FEATURE-SPEC-EN.md` (§ catalog filters / social signals).
Do **Milestone 2 only**. No create wizards. No play-room chat.

## Current M1 baseline
- App reads `src/data/catalog.ts` (not live DB yet).
- `/explore` only filters by single `?tag=`.
- Dark ink+cinnabar theme and Thai UI copy must stay.
- Never mention competitor product names in code, UI, seed, or comments.

## M2 acceptance
1. Catalog filters: multi-tag, rating (safe/mature), time window (e.g. 24h / 7d / 30d / all), contentMode user filter only.
2. Sort: trending | new | most played | most messages | most likes (use available seed fields; stub missing metrics cleanly).
3. Interaction state (client or local persist OK for M2 if DB not wired): like / unlike, save / unsave, follow / unfollow, dislike (personal downrank).
4. Explore + marketplace/list pages honor the same query params.
5. Detail pages show action buttons that toggle state and update counts.
6. `npm run build` passes.
7. No underage fields; all characters remain 18+.

## Out of scope
Create wizards, play room, LLM chat, payments, real Prisma generate/seed if not required to ship filters on catalog.ts.

## Suggested approach
- Extend URL searchParams as single source for filter/sort.
- Shared `filterCatalog(items, params)` helper.
- Lightweight `InteractionStore` (localStorage or in-memory + cookie) until Prisma social tables are wired.
