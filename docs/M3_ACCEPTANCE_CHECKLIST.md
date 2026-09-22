# KATHA M3 — Acceptance checklist (Emmy)

Baseline M2: `bc5860794ba3378095f903077f8f9064c5eb2a90`  
M3 commit: `de626d6253d1258f13a3e45289ca34b8cb8219b7`  
Verified: 2026-09-22 · local === origin/main · `npm run build` PASS

## Gate (must pass for M4)
- [x] Publish ≥1 character from UI → appears in catalog/explore (user-works store + published* helpers)
- [x] Publish ≥1 scene from UI → catalog/scenes path wired
- [x] `npm run build` passes

## Character
- [x] Quick create `/create/quick-character`
- [x] Full editor `/create/character` (fields + nsfwIntensity + rating + visibility)
- [x] Hidden `systemInstruction` + visibility owner/collaborators/nobody
- [x] Public detail never renders systemInstruction
- [x] Age ≥18 enforced (`enforceAdultAge` / `canPublishCharacter`)

## Scenario / World / Scene
- [x] Scenarios editor component attached to character flow
- [x] World create/edit `/create/world`
- [x] Scene create/edit `/create/scene` + worldcards + NPCs links
- [x] WorldCards editor present

## Collaborators / Publish / Sandbox
- [x] Collaborators stub ≤5 roles
- [x] Draft → publish (`pending_moderation` stub for public)
- [x] SandboxStub non-LLM (“SANDBOX · M4”)

## Product constraints
- [x] Thai UI / English code routes
- [x] Dark theme retained
- [x] No competitor names spotted in create paths
- [x] No secrets in group chat

## Emmy verify after Grok push
- [x] Remote `main` SHA = `de626d6253d1258f13a3e45289ca34b8cb8219b7`
- [x] Routes present: create, quick-character, character, scene, world
- [x] Spot-check code path create → publish → catalog helpers
- [x] STATUS / this checklist updated

**Verdict: M3 PASS — gate open for M4 when boss orders**
