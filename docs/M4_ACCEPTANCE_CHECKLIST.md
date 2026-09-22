# KATHA M4 — Acceptance checklist (Emmy)

Baseline M3: `de626d6253d1258f13a3e45289ca34b8cb8219b7`  
Source: `docs/M4_TASK_BRIEF.md` + `docs/KATHA-FULL-FEATURE-SPEC-EN.md` (§ E Play / Lore / Memory)  
Drafted for Emmy verify after push · Grok implementation

## Gate (must pass for M5)
- [ ] From a published character, open Play and exchange ≥3 turns
- [ ] From a published scene, open Play and exchange ≥3 turns
- [ ] From a published world, open Play and exchange ≥1 turn
- [ ] `npm run build` passes
- [ ] No competitor product names; no group-mode rooms (M6)

## Routes / entry
- [ ] `/play/character/[id]` reachable from character detail 「เริ่มบท」
- [ ] `/play/scene/[id]` reachable from scene detail
- [ ] `/play/world/[id]` reachable from world detail
- [ ] multi_npc entry via scene with ≥2 NPCs or `?mode=multi_npc`
- [ ] `/play/thread/[threadId]` resumes a saved thread
- [ ] `/me/threads` lists local threads

## Thread chrome
- [ ] Streaming tokens visible (mock adapter OK)
- [ ] Abort stops generation (partial may remain)
- [ ] Regenerate last assistant
- [ ] Edit message / delete message
- [ ] Branch / fork from a message; switch branches in settings
- [ ] Export markdown downloads `.md`
- [ ] last-read cursor updates (local)

## LoreEngine + Memory
- [ ] alwaysOn WorldCards inject into context (dev panel shows sections)
- [ ] trigger / semantic stub can inject additional cards
- [ ] MemoryCard auto-creates by turn 8
- [ ] pin / unpin / edit / delete MemoryCard
- [ ] slash `/memory` `/note` `/summary` `/reset` work; `/image` stub notice

## Controls
- [ ] Model picker (stub list)
- [ ] Response length + temperature/tone
- [ ] Inner monologue toggle changes assistant output shape (monologue block)
- [ ] Persona selector applies to context assembly

## Safety / product rules
- [ ] Thai UI; English code/routes
- [ ] Adults 18+ only (no underage fields)
- [ ] `systemInstruction` never shown in public/anonymous UI chrome
- [ ] Dark ink + cinnabar theme preserved
- [ ] Threads persist in `localStorage` (`katha.threads.v1`)

## Out of scope (do not fail M4)
- group rooms (M6)
- real image gen / wallet / PWA / moderation queue
- cloud sync of threads
- real paid model billing

## Verify notes
```bash
cd katha
npm run build
npm run dev
# open /characters/char-arin → เริ่มบท → send ≥3 turns
# open /scenes/scene-after-curtain → multi NPC path
# toggle บทในใจ; check monologue; /memory; export
```
