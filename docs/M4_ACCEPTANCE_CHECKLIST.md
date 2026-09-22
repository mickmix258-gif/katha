# KATHA M4 — Acceptance checklist (Emmy)

Baseline M3: `de626d6253d1258f13a3e45289ca34b8cb8219b7` (PASS)  
M4 commit: `b117c198625300ff0ea1f2118ea94a1aa9525b60`  
Verified: 2026-09-22 · local === origin/main · `npm run build` PASS

## Gate
- [x] Play routes for character/scene/world + thread resume (`/me/threads`, `/play/thread/[id]`)
- [x] Mock stream adapter + ≥3-turn capable UI (composer + stream loop)
- [x] `npm run build` passes
- [x] Remote `main` SHA = `b117c198625300ff0ea1f2118ea94a1aa9525b60`

## Play chrome
- [x] `/play/character/[id]`, `/play/scene/[id]`, `/play/world/[id]`
- [x] Message list + composer
- [x] Stream tokens (mock LLM)
- [x] Abort in-flight stream (`AbortController`)
- [x] Regenerate / edit / branch APIs in thread-store + UI
- [x] Delete message path present

## Lore / Memory / Context
- [x] LoreEngine: alwaysOn + triggers + semantic stub + one-hop + token cap
- [x] MemoryCards auto every 8 turns (`MEMORY_AUTO_EVERY_TURNS = 8`)
- [x] Pin/edit/delete memory helpers
- [x] Slash `/memory`

## Controls / UX
- [x] Slash: `/reset` `/summary` `/memory` `/note` `/image` stub
- [x] Inner monologue toggle
- [x] Persona selector
- [x] Export markdown helper
- [x] Thai UI chrome; English modules under `src/lib/play`

## Out of scope
- [x] No group play mode (M6)
- [x] No competitor names in play modules
- [x] No secrets in group chat

## Emmy verify
- [x] SHA match
- [x] Routes + build spot-check
- [x] Checklist + STATUS updated

**Verdict: M4 PASS — Play gate closed; next milestone on boss order**
