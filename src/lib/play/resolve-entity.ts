import {
  getCharacter,
  getScene,
  getWorld,
  type SceneRecord,
} from "@/data/catalog";
import {
  getUserCharacter,
  getUserScene,
  getUserWorld,
  LOCAL_CREATOR,
  type WorldCardDraft,
} from "@/lib/user-works-store";
import type { LoreCard, PlayEntity, PlayMode } from "./types";

function cardId(title: string, type: string, idx: number) {
  return `lore-${type}-${idx}-${title.slice(0, 24)}`;
}

function toLoreCards(
  cards: Array<{
    title: string;
    type: string;
    body: string;
    alwaysOn?: boolean;
    triggerWords?: string | string[];
  }>,
): LoreCard[] {
  return cards.map((c, idx) => {
    const triggers = Array.isArray(c.triggerWords)
      ? c.triggerWords
      : (c.triggerWords ?? "")
          .split(/[,|]/)
          .map((s) => s.trim())
          .filter(Boolean);
    // Seed trigger from title words when empty so semantic/trigger can fire
    const fallback = c.title.split(/\s+/).filter((w) => w.length >= 2);
    return {
      id: cardId(c.title, c.type, idx),
      title: c.title,
      type: c.type,
      body: c.body,
      triggerWords: triggers.length ? triggers : fallback,
      alwaysOn: Boolean(c.alwaysOn),
      linkedCardIds: [],
      weight: c.alwaysOn ? 1.2 : 1,
    };
  });
}

function linkOneHop(cards: LoreCard[]): LoreCard[] {
  if (cards.length < 2) return cards;
  // Simple chain: each card links to the next (one hop demo)
  return cards.map((c, i) => ({
    ...c,
    linkedCardIds: i + 1 < cards.length ? [cards[i + 1].id] : [],
  }));
}

function npcName(id: string): string | undefined {
  return getCharacter(id)?.name ?? getUserCharacter(id)?.name;
}

export function resolvePlayEntity(
  mode: PlayMode,
  id: string,
): PlayEntity | null {
  if (mode === "character" || mode === "multi_npc") {
    // multi_npc with character id still resolves character; multi uses scene preferably
    const seed = getCharacter(id);
    const user = getUserCharacter(id);
    if (seed) {
      return {
        mode: mode === "multi_npc" ? "multi_npc" : "character",
        id: seed.id,
        title: seed.name,
        greeting: seed.greeting,
        personality: seed.personality,
        speakingStyle: seed.speakingStyle,
        description: seed.description,
        systemInstruction: undefined, // seed has no hidden prompt
        npcNames: [seed.name],
        loreCards: [],
        isOwner: false,
      };
    }
    if (user) {
      return {
        mode: mode === "multi_npc" ? "multi_npc" : "character",
        id: user.id,
        title: user.name,
        greeting: user.greeting,
        personality: user.personality,
        speakingStyle: user.speakingStyle,
        description: user.description,
        // Available to context assembly only; UI must not show to anonymous
        systemInstruction: user.systemInstruction || undefined,
        npcNames: [user.name],
        loreCards: [],
        isOwner: user.creatorHandle === LOCAL_CREATOR,
      };
    }
    return null;
  }

  if (mode === "scene") {
    const seed = getScene(id);
    const user = getUserScene(id);
    if (seed) return sceneToEntity(seed, false);
    if (user) {
      const cards = linkOneHop(toLoreCards(user.worldCards as WorldCardDraft[]));
      const names = user.npcIds.map(npcName).filter(Boolean) as string[];
      return {
        mode: names.length > 1 ? "multi_npc" : "scene",
        id: user.id,
        title: user.title,
        openingNarration: user.openingNarration,
        premise: user.premise,
        setting: user.setting,
        tone: user.tone,
        playerRole: user.playerRole,
        npcNames: names,
        loreCards: cards,
        isOwner: user.creatorHandle === LOCAL_CREATOR,
      };
    }
    return null;
  }

  if (mode === "world") {
    const seed = getWorld(id);
    const user = getUserWorld(id);
    if (seed) {
      const names = seed.residentIds.map(npcName).filter(Boolean) as string[];
      const loreCards = linkOneHop(
        toLoreCards([
          {
            title: seed.title,
            type: "custom",
            body: seed.lore,
            alwaysOn: true,
            triggerWords: seed.title,
          },
          {
            title: "ฉากหลัง",
            type: "location",
            body: seed.setting,
            triggerWords: seed.setting.split(/\s+/).slice(0, 4).join(","),
          },
        ]),
      );
      return {
        mode: "world",
        id: seed.id,
        title: seed.title,
        premise: seed.premise,
        lore: seed.lore,
        setting: seed.setting,
        tone: seed.tone,
        npcNames: names,
        loreCards,
        isOwner: false,
      };
    }
    if (user) {
      const names = user.residentIds.map(npcName).filter(Boolean) as string[];
      const fromDraft = toLoreCards(user.worldCards);
      const base =
        fromDraft.length > 0
          ? fromDraft
          : toLoreCards([
              {
                title: user.title,
                type: "custom",
                body: user.lore,
                alwaysOn: true,
              },
            ]);
      return {
        mode: "world",
        id: user.id,
        title: user.title,
        premise: user.premise,
        lore: user.lore,
        setting: user.setting,
        tone: user.tone,
        npcNames: names,
        loreCards: linkOneHop(base),
        isOwner: user.creatorHandle === LOCAL_CREATOR,
      };
    }
    return null;
  }

  return null;
}

function sceneToEntity(seed: SceneRecord, isOwner: boolean): PlayEntity {
  const names = seed.npcIds.map(npcName).filter(Boolean) as string[];
  const cards = linkOneHop(
    toLoreCards(
      seed.worldCards.map((c) => ({
        ...c,
        triggerWords: c.title,
      })),
    ),
  );
  return {
    mode: names.length > 1 ? "multi_npc" : "scene",
    id: seed.id,
    title: seed.title,
    openingNarration: seed.openingNarration,
    premise: seed.premise,
    setting: seed.setting,
    tone: seed.tone,
    playerRole: seed.playerRole,
    npcNames: names,
    loreCards: cards,
    isOwner,
  };
}

export function playHref(mode: PlayMode, id: string) {
  if (mode === "multi_npc") return `/play/scene/${id}`;
  return `/play/${mode}/${id}`;
}
