# KATHA Milestone 3 — Task brief (Emmy × Grok)

Source of truth: `docs/KATHA-FULL-FEATURE-SPEC-EN.md` (§ Editors / C–D, §8 M3).
Repo: https://github.com/mickmix258-gif/katha · baseline `main` @ `bc5860794ba3378095f903077f8f9064c5eb2a90` (M2 closed).

Do **Milestone 3 only**. No play-room chat / LLM stream (M4). No payments.

## Goal
Ship create/edit wizards so a creator can publish at least **one character** and **one scene** (gate for M4).

## In scope
1. Quick character create (`/create/quick-character`): name + prompt → system fills draft fields; user can refine.
2. Full character editor: name, tagline, description, gender presentation, appearance, personality, speaking style, greeting, example dialogues, tags/hashtags, nsfwIntensity, rating, visibility; hidden systemInstruction with visibility owner/collaborators/nobody.
3. Scenario objects (บทเปิด) attachable to a character: title, description, prompt, first message, tags, rating.
4. World create/edit (`/create/world`): title, cover stub, premise, tone, setting, lore, residents link.
5. Scene create/edit: premise, opening narration, linked world, NPCs, worldcards.
6. Collaborators stub: up to 5 authors with roles owner/editor/credited (UI + local/catalog persistence OK if Prisma social not fully wired).
7. Sandbox preview: non-LLM stub chat UI (“soon / M4”) that proves publish path without streaming models.
8. Publish flow: draft → publish; public may show “pending moderation” stub.
9. Thai visible copy; English code/schema/routes; dark ink+cinnabar theme; no competitor names; all ages 18+.

## Hard constraints
- All characters 18+; no underage field anywhere in forms or seed writes.
- Never mention competitor product names.
- Thai UI copy; English code/schema/routes.

## Out of scope
Play threads, stream/regen/branch/memory/lore engine (M4), real image gen, wallet, group rooms, real moderation queue.

## Acceptance
0. Create forms enforce adult 18+ only — no underage field; reject/block age < 18.
1. From UI, create + publish ≥1 character and ≥1 scene that appear in catalog/explore.
2. Quick + full character paths both usable.
3. World + scene editors save and link residents/NPCs/worldcards.
4. `systemInstruction` / hidden prompt never shown to anonymous viewers (owner/collaborators/nobody visibility honored).
5. `npm run build` passes.
6. Brief + README updated; no secrets in group chat.

## Split (proposed)
- **Grok:** routes/forms/state + catalog write path + publish wiring
- **Emmy:** acceptance checklist, copy/UX gaps, SHA/remote verify after push
