export type PlayMode = "character" | "scene" | "world" | "multi_npc";

export type MessageRole = "user" | "assistant" | "system" | "narrator";

export type PlayMessage = {
  id: string;
  role: MessageRole;
  content: string;
  /** Optional inner monologue block shown when toggle is on */
  monologue?: string;
  createdAt: string;
  branchId: string;
  /** Parent message id when this message was branched/edited from */
  parentId?: string;
  edited?: boolean;
};

export type ThreadBranch = {
  id: string;
  name: string;
  forkedFromMessageId?: string;
  createdAt: string;
};

export type MemoryCard = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  /** User-turn index when auto-created (1-based) */
  turnIndex: number;
};

export type Persona = {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  privateNotes: string;
  isDefault?: boolean;
};

export type ResponseLength = "short" | "medium" | "long";

export type ThreadSettings = {
  modelId: string;
  responseLength: ResponseLength;
  /** 0–1 style knob (stub) */
  temperature: number;
  tone: string;
  innerMonologue: boolean;
  personaId: string;
};

export type PlayThread = {
  id: string;
  mode: PlayMode;
  entityId: string;
  entityTitle: string;
  messages: PlayMessage[];
  activeBranchId: string;
  branches: ThreadBranch[];
  memoryCards: MemoryCard[];
  settings: ThreadSettings;
  summary: string;
  lastReadMessageId?: string;
  /** Count of completed user→assistant exchanges */
  turnCount: number;
  createdAt: string;
  updatedAt: string;
  scenarioId?: string;
};

export type LoreCard = {
  id: string;
  title: string;
  type: string;
  body: string;
  triggerWords: string[];
  alwaysOn: boolean;
  linkedCardIds: string[];
  weight: number;
};

export type PlayEntity = {
  mode: PlayMode;
  id: string;
  title: string;
  greeting?: string;
  openingNarration?: string;
  systemInstruction?: string;
  personality?: string;
  speakingStyle?: string;
  description?: string;
  premise?: string;
  lore?: string;
  setting?: string;
  tone?: string;
  playerRole?: string;
  npcNames: string[];
  loreCards: LoreCard[];
  /** Never expose systemInstruction in public UI chrome */
  isOwner: boolean;
};

export type AssembledContext = {
  sections: { key: string; label: string; text: string }[];
  injectedLoreIds: string[];
  promptText: string;
};

export const MODEL_OPTIONS = [
  { id: "katha-mock-fast", label: "KATHA Mock Fast" },
  { id: "katha-mock-story", label: "KATHA Mock Story" },
  { id: "katha-mock-deep", label: "KATHA Mock Deep (stub)" },
] as const;

export const DEFAULT_SETTINGS = (): ThreadSettings => ({
  modelId: "katha-mock-story",
  responseLength: "medium",
  temperature: 0.7,
  tone: "ตามตัวละคร",
  innerMonologue: false,
  personaId: "persona-default",
});

export const LORE_TOKEN_CAP = 800;
export const MEMORY_AUTO_EVERY_TURNS = 8;
export const RAW_MESSAGE_WINDOW = 16;
