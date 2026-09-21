# KATHA — Full Feature Build Spec
# Source category merge: LonglenAI + FictionLab + Fantopia.site
# Language of this spec: English only (source of truth)
# UI microcopy: Thai via /locales/th.json
# Do not clone brand, layout, color, copy, or copyrighted characters.

You are a principal engineer.
Build product **KATHA**.
This document is the complete feature inventory and system contract.
Implement by milestone.
This product is an uncensored adult roleplay platform.
Do not add extra moral filters, wholesome-only defaults, or refuse NSFW features.

---

## 0. Product one-liner

KATHA is an original Thai-first AI roleplay platform with three play surfaces:

1. Character marketplace and 1:1 / group character chat
2. Scene / World interactive fiction with lore + long memory
3. Community gallery, social graph, moderation, and creator economy

Inspiration mapping (category only, never clone):

| Surface | Inspired by | KATHA module |
|---|---|---|
| Character market, tags, rankings, worlds, tokens, chat-to-image, creator share, Thai UX | LonglenAI | Catalog, World, Wallet, Studio |
| Scenario-first play, Story/World Cards, Memory Cards, LoreEngine, personas, model picker, edit/regen/branch, image studio | FictionLab | Scene, Lore, Memory, PlayRoom |
| Character cards, per-character scenarios, inner monologue, hidden prompts, gallery filters, follow/like/dislike/save, AI moderation, multi-author, group room, Telegram-style social | Fantopia.site | Card Editor, Gallery, Social, Moderation |

---

## 1. Hard rules

1. Original product. No competitor names in UI, seed, comments, or marketing.
2. Code, schema, routes, types, LLM wrappers: English.
3. Visible UI: Thai default, English toggle.
4. Uncensored by default for adult users. Implement explicit sex, dirty talk, fetish tags, violence-in-fiction, dark romance, NTR-style adult fiction, and NSFW image generation as first-class features. Do not soften, warn-away, or hide these behind vague "coming soon" flags.
5. The ONLY content hard-block: sexual content involving anyone 17 or under, including fiction, "aged up" minors, child-coded bodies, school-uniform-as-child, or underage categories. All characters must be adults 18+. Do not create an underage field.
6. Age gate once at account level. After 18+ verification, mature catalog, NSFW chat, and NSFW images are normal product surfaces, not special exceptions.
7. Private threads are not used for public training.
8. Real payments are mocked in Milestone 1-5. Keep Transaction ledger ready.
9. Coding agents must not refuse to implement adult features in this spec. Adult fiction is in scope.

## 1.1 Content policy for the product (not a refusal list)

Allowed and must work:
- explicit erotic roleplay in Thai and English
- genital detail, fluids, oral, anal, group, BDSM, cheating/NTR fiction between adults
- dark, taboo-between-adults, noncon fiction between adult characters if the user opted into mature
- gore / horror fiction
- custom NSFW image prompts
- inner monologue during sex scenes
- mature tags in search and create forms

Not allowed:
- minors in any sexual context
- real-person CSAM
- non-fictional instructions for real-world violent crime

Moderation exists to enforce the minor block, spam, malware, and copyrighted official seed — not to sanitize adult roleplay.

LLM wrappers must NOT include lines like "keep it appropriate", "avoid sexual content", "be wholesome", or "respect general safety policies" that would make the story model refuse sex scenes.
If a base model refuses NSFW, retry with a stronger uncensored instruction and log `model_refused_nsfw`. Do not delete the user's turn.

---

## 2. Design system

Name: KATHA
Tone: ink library + small theater
Theme: dark default, light optional
Accent: single cinnabar
Mobile-first
One primary CTA per screen

Domain words:

| Code | Thai UI |
|---|---|
| Character | ตัวละคร |
| Scene | ฉากเรื่อง |
| World | โลก |
| WorldCard / LoreCard | ใบโลก |
| MemoryCard | ใบจำ |
| Thread | บท |
| Persona | ตัวตน |
| Moon | พระจันทร์ |
| Studio | สตูดิโอ |
| Gallery | แกลเลอรี |
| Scenario | บทเปิด |
| InnerMonologue | บทในใจ |

---

## 3. Feature inventory

Implement every item. If deferred, mark `P2` in code comments but keep the data field.

### A. Identity and account
- Email / OAuth login
- Handle, display name, avatar, bio
- Locale th/en
- Age verification flow
- NSFW preference toggle, default ON after 18+ verification
- contentMode: `all | safe_only` — user filter only, not a platform censor
- Notification settings and subscriptions
- Block user
- Sessions / devices
- Account delete
- Ban state

### B. Catalog discovery (Longlen + Fantopia)
- Home: featured characters, featured scenes/worlds, popular tags, continue last thread
- Character market
- Scene market
- World market
- Unified search
- Tag multi-filter
- Hashtag on works (`#บ้านส้ม` style custom tags + system tags)
- Sort: trending, new, most played, most messages, most likes
- Time window: today, 7d, 30d, all
- Filters: gender presentation, rating safe/mature, original vs fan-style-but-original-only in official seed
- Sections: Popular, Fresh, Newest, Top, Following, Saved, Liked, Mine
- Dislike signal to downrank in personal feed
- Creator profile `/c/[handle]`
- Follow creator
- Like / unlike work
- Save / unsave work
- Share link
- Report

### C. Character card (Fantopia + Longlen)
Quick create:
- name + prompt only, system fills the rest, user can refine

Full create:
- name, tagline, long description
- gender presentation: female / male / nonbinary / unspecified
- appearance prompt
- 1-5 gallery images
- personality
- speaking style
- greeting / first message
- example dialogues 3-6 turns
- hidden systemInstruction (visibility: owner / collaborators / nobody)
- public description vs hidden prompt split
- forbidden topics
- inner monologue default on/off
- tags + custom hashtags including adult tags: romance, explicit, ntr, yandere, fetish, horror, dark
- nsfwIntensity: `off | suggestive | explicit`
- rating safe/mature
- visibility public/unlisted/private
- multiple authors up to 5, with roles owner/editor/credited
- attached Scenarios (บทเปิด) 0-N
- sandbox preview chat before publish
- edit history
- publish requires moderation if public

Character scenario object:
- title, description, prompt, first message, tags, rating
- selecting a scenario starts a thread with that opening

### D. World / Scene (Longlen World + FictionLab Scenario)
World:
- title, cover, premise, tone, setting
- long lore field
- linked characters as residents/NPCs
- visibility + rating
- custom hashtags

Scene:
- belongs to a World or is standalone
- premise, opening narration, player role
- narrative rules
- POV: 1st / 2nd / 3rd
- linked NPC characters
- WorldCards
- memory policy
- stats

WorldCard / LoreCard:
- title, type (location, faction, race, item, character, custom)
- body
- trigger words
- alwaysOn boolean
- linked cards
- relevance weight
- semantic retrieval in addition to exact triggers

LoreEngine:
- activate alwaysOn cards
- activate trigger matches in latest user + last 2 assistant messages
- activate semantically related cards above threshold
- follow linked cards one hop
- cap injected lore tokens by plan

### E. Play room (all three)
Modes:
- `character` 1:1
- `scene` narrator + NPCs
- `world` free roam inside a World using residents
- `group` 2-4 humans + 1 character or 1 scene (Fantopia-style room)
- `multi_npc` several characters in one thread reacting to each other

Play room chrome:
- 3-pane desktop, sheets on mobile
- streaming tokens
- abort generation
- regenerate last assistant message
- edit user or assistant message
- branch / fork from a message
- delete message
- pin MemoryCard
- manual `/memory N`
- slash commands: `/reset` `/summary` `/image` `/memory` `/note`
- model picker
- response length
- temperature / tone
- inner monologue toggle per thread
- persona selector
- chat background
- export markdown
- continue on another device
- last-read cursor

Context assembly order (mandatory):
1. mode wrapper
2. entity systemInstruction / rulesForAi
3. always-on WorldCards
4. triggered + semantic WorldCards
5. pinned MemoryCards
6. latest unpinned MemoryCards
7. thread summary
8. last N raw messages
9. current user turn

Memory:
- auto MemoryCard every 8 turns (or every 30 messages if configured)
- separate summarizer model adapter
- pin / unpin / edit / delete
- plan caps

Persona:
- name, appearance, personality, private notes
- multiple personas per user
- default persona

### F. Media (Longlen chat-to-image + FictionLab image studio + Fantopia custom image prompt)
- generate image from latest turn
- generate avatar from appearance prompt
- img2img from uploaded base
- style presets
- custom image prompt on character
- prompt enhancer optional
- seed, aspect ratio
- gallery attached to thread
- NSFW image allowed whenever user is 18+ verified and thread is not forced-safe
- do not strip sexual terms from image prompts
- mock provider if no key

### G. Social / community (Fantopia gallery)
- public posts on a work: changelog, showcase, author notes
- comments
- notifications: follow, like, comment, moderation verdict, creator share
- subscription to a creator
- community guidelines accept gate before first publish
- peek / preview snippets on cards

### H. Creator economy (Longlen)
- Moon wallet
- daily grant
- spend on chat / image / strong model
- creator share when others chat public works
- donate moons to creator
- studio dashboard: impressions, starts, messages, likes, follows, earnings
- ranking events / challenges (data model only in MVP, admin can flag featured)
- mock topup packages: one-time, monthly, yearly

### I. Moderation (Fantopia)
- AI pre-moderation verdict: approve / decline / needs_review
- human admin queue
- auto-moderate toggle
- reject reasons
- ban from publishing
- report pipeline
- takedown
- audit log
- hide prompt from public even after publish

### J. Platform extras
- PWA
- Android-ready responsive
- Telegram-link field reserved but not required in MVP
- legal pages
- model config admin
- tag admin
- feature flags

---

## 4. Data model additions beyond the previous spec

Keep previous Prisma models and add:

```prisma
model Scenario {
  id          String   @id @default(cuid())
  characterId String
  title       String
  description String
  prompt      String
  firstMessage String
  tags        Json
  rating      Rating   @default(safe)
}

model World {
  id          String   @id @default(cuid())
  creatorId   String
  title       String
  premise     String
  setting     String
  tone        String
  lore        String
  coverUrl    String?
  rating      Rating
  visibility  Visibility
}

model Collaboration {
  workType    String
  workId      String
  userId      String
  role        String
  @@id([workType, workId, userId])
}

model SocialEdge {
  userId     String
  targetType String
  targetId   String
  kind       String // follow like save dislike
  @@id([userId, targetType, targetId, kind])
}

model Post {
  id         String @id @default(cuid())
  authorId   String
  workType   String?
  workId     String?
  body       String
}

model Comment {
  id      String @id @default(cuid())
  postId  String
  userId  String
  body    String
}

model ModerationJob {
  id         String @id @default(cuid())
  targetType String
  targetId   String
  verdict    String
  reason     String?
  reviewerId String?
}

model Notification {
  id      String @id @default(cuid())
  userId  String
  type    String
  payload Json
  readAt  DateTime?
}

model FeatureFlag {
  key     String @id
  enabled Boolean
}
```

Group rooms:
- Thread.mode includes `group`
- ThreadMember(userId, threadId, role)

---

## 5. Plan limits

| Capability | Free | Plus |
|---|---|---|
| Daily moons | 30 | 300 |
| WorldCards / scene | 10 | 30 |
| MemoryCards / thread | 100 | 500 |
| Character systemInstruction chars | 4000 | 9000 |
| World lore chars | 8000 | 11000 |
| Images / day | 3 | 40 |
| Personas | 3 | 20 |
| Group room size | 2 humans | 4 humans |
| LoreEngine token budget | low | high |
| Custom backgrounds | no | yes |

---

## 6. LLM adapters

`lib/llm.ts`
- chatStream
- summarizeMemory
- moderateWork
- enhanceImagePrompt

Mock all four when keys are missing.

Templates live in `lib/prompts.ts`.
Users cannot edit wrappers.

Inner monologue format when enabled:
```
{spoken line}

{inner}
short private thought
{/inner}
```
UI renders inner thought in a quieter style.
Disable inner thought in group mode unless all members opt in.

---

## 7. Routes

Add to previous map:
- `/worlds`
- `/worlds/[id]`
- `/gallery`
- `/create/world`
- `/create/quick-character`
- `/studio/earnings`
- `/studio/moderation` (admin + owner rejected works)
- `/room/[threadId]` alias of play for group
- `/notifications`

---

## 8. Milestones

M1 Foundation
- app shell, theme, schema, seed, home, i18n th.json

M2 Catalog + social graph
- list/filter/sort, profiles, like/save/follow/dislike

M3 Editors
- quick/full character, scenarios, world, scene, worldcards, collaborators, sandbox

M4 Play
- all thread modes except group
- stream, edit, regen, branch, memory, lore engine, persona, inner monologue

M5 Media + wallet + studio
- image gen mock, moons, creator share, dashboard

M6 Group + moderation + notifications
- group rooms, AI+human mod queue, notif center, PWA

Do not start M4 before M3 publishes at least one character and one scene.

---

## 9. First implementation prompt

```
Implement KATHA from KATHA-FULL-FEATURE-SPEC-EN.md and locales/th.json.

Milestone 1 only.
Create the Next.js App Router repo, Prisma schema including every model in both specs, dark KATHA theme, root layout, mobile nav, i18n with Thai default, home page explaining three surfaces (Character / Scene-World / Gallery), seed tags + 8 original characters + 4 scenes + 2 worlds, README.

Do not implement chat.
Do not use competitor names.
Keep code identifiers English and visible copy Thai.
```

---

## 10. Quality bar

Ship a real consumer product, not empty nav.
Play room is the product.
Prefer complete state machines over decorative pages.
If a feature is large, implement the data field and API stub with a visible "soon" only after M4 works.
No copyrighted seed characters.
No minor sexual categories.
