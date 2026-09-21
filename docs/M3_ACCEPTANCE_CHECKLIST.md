# KATHA M3 — Acceptance checklist (Emmy)

Baseline: `main` @ `bc5860794ba3378095f903077f8f9064c5eb2a90`  
Source: `docs/M3_TASK_BRIEF.md` + `docs/KATHA-FULL-FEATURE-SPEC-EN.md` (§ Editors / M3)

## Gate (must pass for M4)
- [ ] Publish ≥1 character from UI → appears in catalog/explore
- [ ] Publish ≥1 scene from UI → appears in catalog/explore
- [ ] `npm run build` passes

## Character
- [ ] Quick create (`/create/quick-character`): name + prompt → draft fields filled; can refine
- [ ] Full editor: name, tagline, description, gender presentation, appearance, personality, speaking style, greeting, example dialogues, tags, nsfwIntensity, rating, visibility
- [ ] Hidden `systemInstruction` with visibility owner / collaborators / nobody
- [ ] Anonymous / public viewers never see hidden prompt
- [ ] Age gate: all characters 18+; no underage fields

## Scenario (บทเปิด)
- [ ] Attach 0–N scenarios to a character
- [ ] Fields: title, description, prompt, first message, tags, rating
- [ ] Save persists with character

## World / Scene
- [ ] World create/edit: title, cover stub, premise, tone, setting, lore, residents link
- [ ] Scene create/edit: premise, opening narration, linked world, NPCs, worldcards
- [ ] WorldCards save and link on scene/world

## Collaborators / Publish / Sandbox
- [ ] Collaborators stub ≤5 with roles owner / editor / credited (local/catalog OK)
- [ ] Draft → publish flow works
- [ ] Public publish may show “pending moderation” stub (not a real queue)
- [ ] Sandbox preview is non-LLM stub (“soon / M4”), proves path without streaming

## Product constraints
- [ ] Thai visible copy; English code/schema/routes
- [ ] Dark ink + cinnabar theme kept
- [ ] No competitor product names in UI/code/seed/comments
- [ ] No secrets in group chat

## Emmy verify after Grok push
- [ ] Remote `main` SHA matches local M3 commit
- [ ] Spot-check create → publish → catalog for 1 character + 1 scene
- [ ] Update STATUS.md
