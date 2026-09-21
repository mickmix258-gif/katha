"use client";

import type { Intensity, Rating } from "@/data/catalog";

export type PublishStatus = "draft" | "published" | "pending_moderation";
export type WorkVisibility = "public" | "unlisted" | "private";
export type PromptVisibility = "owner" | "collaborators" | "nobody";
export type CollaboratorRole = "owner" | "editor" | "credited";

export type Collaborator = {
  handle: string;
  role: CollaboratorRole;
};

export type ScenarioDraft = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  firstMessage: string;
  tags: string[];
  rating: Rating;
};

export type WorldCardDraft = {
  title: string;
  type: string;
  body: string;
  triggerWords?: string;
  alwaysOn?: boolean;
};

export type UserCharacter = {
  kind: "character";
  id: string;
  creatorHandle: string;
  name: string;
  tagline: string;
  description: string;
  personality: string;
  speakingStyle: string;
  greeting: string;
  genderPresentation: string;
  appearancePrompt: string;
  exampleDialogues: string;
  systemInstruction: string;
  systemInstructionVisibility: PromptVisibility;
  forbiddenTopics: string;
  rating: Rating;
  nsfwIntensity: Intensity;
  tags: string[];
  hashtags: string[];
  visibility: WorkVisibility;
  age: number;
  scenarios: ScenarioDraft[];
  collaborators: Collaborator[];
  status: PublishStatus;
  messageCount: number;
  likeCount: number;
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  coverStub?: string;
};

export type UserScene = {
  kind: "scene";
  id: string;
  creatorHandle: string;
  worldId?: string;
  title: string;
  premise: string;
  openingNarration: string;
  setting: string;
  tone: string;
  playerRole: string;
  rating: Rating;
  tags: string[];
  npcIds: string[];
  worldCards: WorldCardDraft[];
  collaborators: Collaborator[];
  visibility: WorkVisibility;
  status: PublishStatus;
  playCount: number;
  likeCount: number;
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  coverStub?: string;
};

export type UserWorld = {
  kind: "world";
  id: string;
  creatorHandle: string;
  title: string;
  premise: string;
  setting: string;
  tone: string;
  lore: string;
  rating: Rating;
  tags: string[];
  residentIds: string[];
  worldCards: WorldCardDraft[];
  collaborators: Collaborator[];
  visibility: WorkVisibility;
  status: PublishStatus;
  playCount: number;
  likeCount: number;
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  coverStub?: string;
};

export type UserWork = UserCharacter | UserScene | UserWorld;

export type UserWorksState = {
  characters: UserCharacter[];
  scenes: UserScene[];
  worlds: UserWorld[];
};

const KEY = "katha.userWorks.v1";
export const LOCAL_CREATOR = "me";

export const emptyWorks = (): UserWorksState => ({
  characters: [],
  scenes: [],
  worlds: [],
});

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readWorks(): UserWorksState {
  if (typeof window === "undefined") return emptyWorks();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyWorks();
    const parsed = JSON.parse(raw) as UserWorksState;
    return {
      characters: parsed.characters ?? [],
      scenes: parsed.scenes ?? [],
      worlds: parsed.worlds ?? [],
    };
  } catch {
    return emptyWorks();
  }
}

export function writeWorks(state: UserWorksState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-works"));
}

export function upsertCharacter(work: UserCharacter) {
  const state = readWorks();
  const idx = state.characters.findIndex((c) => c.id === work.id);
  if (idx >= 0) state.characters[idx] = work;
  else state.characters.unshift(work);
  writeWorks(state);
  return work;
}

export function upsertScene(work: UserScene) {
  const state = readWorks();
  const idx = state.scenes.findIndex((c) => c.id === work.id);
  if (idx >= 0) state.scenes[idx] = work;
  else state.scenes.unshift(work);
  writeWorks(state);
  return work;
}

export function upsertWorld(work: UserWorld) {
  const state = readWorks();
  const idx = state.worlds.findIndex((c) => c.id === work.id);
  if (idx >= 0) state.worlds[idx] = work;
  else state.worlds.unshift(work);
  writeWorks(state);
  return work;
}

export function getUserCharacter(id: string) {
  return readWorks().characters.find((c) => c.id === id);
}

export function getUserScene(id: string) {
  return readWorks().scenes.find((c) => c.id === id);
}

export function getUserWorld(id: string) {
  return readWorks().worlds.find((c) => c.id === id);
}

/** Works visible in public catalog (published or pending moderation stub). */
export function publishedCharacters() {
  return readWorks().characters.filter(
    (c) =>
      (c.status === "published" || c.status === "pending_moderation") &&
      c.visibility !== "private",
  );
}

export function publishedScenes() {
  return readWorks().scenes.filter(
    (c) =>
      (c.status === "published" || c.status === "pending_moderation") &&
      c.visibility !== "private",
  );
}

export function publishedWorlds() {
  return readWorks().worlds.filter(
    (c) =>
      (c.status === "published" || c.status === "pending_moderation") &&
      c.visibility !== "private",
  );
}

export function defaultCollaborators(): Collaborator[] {
  return [{ handle: LOCAL_CREATOR, role: "owner" }];
}

export function enforceAdultAge(age: number): number {
  const n = Number.isFinite(age) ? Math.floor(age) : 18;
  return Math.max(18, n);
}

export function canPublishCharacter(c: Pick<UserCharacter, "name" | "age">): string | null {
  if (!c.name.trim()) return "ต้องมีชื่อตัวละคร";
  if (c.age < 18) return "ตัวละครต้องอายุ 18 ปีขึ้นไป";
  return null;
}

export function canPublishScene(s: Pick<UserScene, "title" | "premise">): string | null {
  if (!s.title.trim()) return "ต้องมีชื่อฉาก";
  if (!s.premise.trim()) return "ต้องมีบทนำฉาก";
  return null;
}

export function canPublishWorld(w: Pick<UserWorld, "title" | "premise">): string | null {
  if (!w.title.trim()) return "ต้องมีชื่อโลก";
  if (!w.premise.trim()) return "ต้องมีบทนำโลก";
  return null;
}

/** Heuristic draft fill from name + free prompt (no LLM). */
export function autoFillCharacter(name: string, prompt: string): Partial<UserCharacter> {
  const clean = prompt.trim() || `ตัวละครชื่อ ${name}`;
  const firstSentence = clean.split(/[.。!?!\n]/).map((s) => s.trim()).filter(Boolean)[0] ?? clean;
  return {
    name: name.trim() || "ตัวละครไม่มีชื่อ",
    tagline: firstSentence.slice(0, 80),
    description: clean.slice(0, 600),
    personality: `จากพรอมต์: ${firstSentence.slice(0, 120)}`,
    speakingStyle: "ภาษาไทยธรรมชาติ ตามบุคลิกในพรอมต์",
    greeting: `สวัสดี ฉันคือ${name.trim() || "ตัวละครนี้"} — เริ่มคุยกันเลยได้ไหม`,
    appearancePrompt: clean.slice(0, 200),
    systemInstruction: [
      `You are ${name.trim() || "the character"}.`,
      "Stay in character. Thai or English matching the user.",
      `Creator prompt: ${clean.slice(0, 1500)}`,
      "All characters are adults 18+. Never portray minors.",
    ].join("\n"),
    exampleDialogues: `ผู้เล่น: สวัสดี\n${name.trim() || "ตัวละคร"}: ${firstSentence.slice(0, 100)}`,
  };
}
