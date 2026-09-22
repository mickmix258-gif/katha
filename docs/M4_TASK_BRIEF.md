# KATHA Milestone 4 — Play (Emmy × Grok)

Source: `docs/KATHA-FULL-FEATURE-SPEC-EN.md` § E Play room + LoreEngine + Memory.
Baseline: `main` @ `de626d6253d1258f13a3e45289ca34b8cb8219b7` (M3 PASS).

Do **M4 only**. No group rooms (M6). No real payments. No competitor names.

## Goal
Ship a usable Play room for `character` / `scene` / `world` / `multi_npc` with streaming UX, edit/regen/branch, memory cards, lore injection, persona, and inner monologue — enough to chat with published M3 works.

## In scope
1. Play routes: `/play/character/[id]`, `/play/scene/[id]`, `/play/world/[id]` (+ multi_npc entry)
2. Thread chrome: message list, composer, abort, regenerate last assistant, edit message, branch/fork, delete
3. Streaming tokens (mock LLM adapter OK if no API key — typewriter/stream chunks with deterministic stub + optional real provider later)
4. Context assembly order (mandatory) as in spec § E
5. LoreEngine: alwaysOn + trigger words on last user + last 2 assistant msgs + simple semantic stub + one-hop links; token cap
6. MemoryCards: auto every 8 turns, pin/unpin/edit/delete, `/memory` slash
7. Slash: `/reset` `/summary` `/memory` `/note` (`/image` stub)
8. Controls: model picker (stub list), length, temperature/tone, inner monologue toggle, persona selector
9. Export markdown; last-read cursor (local)
10. Thai UI; English code; 18+ only; hide systemInstruction from non-owners in UI chrome

## Out of scope
- `group` mode (M6)
- Real image gen, wallet, PWA, moderation queue
- Cloud GPU / paid model billing

## Acceptance
1. From a published character/scene/world, user can open Play and exchange ≥3 turns
2. Stream + abort + regen + edit + branch work in UI
3. MemoryCard auto-creates by turn 8; pin works
4. WorldCards/lore inject into context (visible debug panel OK in dev)
5. Inner monologue toggle changes assistant stub output shape
6. `npm run build` passes
7. No secrets in group chat; no competitor names

## Split
- **Grok:** play UI, thread store, lore/memory engines, mock stream adapter
- **Emmy:** acceptance checklist + verify after push
