"use client";

import { newId } from "@/lib/user-works-store";
import {
  DEFAULT_SETTINGS,
  type MemoryCard,
  type PlayMessage,
  type PlayMode,
  type PlayThread,
  type ThreadSettings,
} from "./types";

const KEY = "katha.threads.v1";

export type ThreadStoreState = {
  threads: PlayThread[];
};

function empty(): ThreadStoreState {
  return { threads: [] };
}

export function readThreads(): ThreadStoreState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ThreadStoreState;
    return { threads: parsed.threads ?? [] };
  } catch {
    return empty();
  }
}

export function writeThreads(state: ThreadStoreState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-threads"));
}

export function getThread(id: string): PlayThread | undefined {
  return readThreads().threads.find((t) => t.id === id);
}

export function listThreadsForEntity(mode: PlayMode, entityId: string): PlayThread[] {
  return readThreads()
    .threads.filter((t) => t.mode === mode && t.entityId === entityId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listThreadsByEntityId(entityId: string): PlayThread[] {
  return readThreads()
    .threads.filter((t) => t.entityId === entityId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listAllThreads(): PlayThread[] {
  return [...readThreads().threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveThread(thread: PlayThread) {
  const state = readThreads();
  const idx = state.threads.findIndex((t) => t.id === thread.id);
  const next = { ...thread, updatedAt: new Date().toISOString() };
  if (idx >= 0) state.threads[idx] = next;
  else state.threads.unshift(next);
  writeThreads(state);
  return next;
}

export function deleteThread(id: string) {
  const state = readThreads();
  writeThreads({ threads: state.threads.filter((t) => t.id !== id) });
}

export function createThread(input: {
  mode: PlayMode;
  entityId: string;
  entityTitle: string;
  opening?: { role: PlayMessage["role"]; content: string };
  scenarioId?: string;
  settings?: Partial<ThreadSettings>;
}): PlayThread {
  const now = new Date().toISOString();
  const branchId = newId("branch");
  const messages: PlayMessage[] = [];
  if (input.opening?.content) {
    messages.push({
      id: newId("msg"),
      role: input.opening.role,
      content: input.opening.content,
      createdAt: now,
      branchId,
    });
  }
  const thread: PlayThread = {
    id: newId("thread"),
    mode: input.mode,
    entityId: input.entityId,
    entityTitle: input.entityTitle,
    messages,
    activeBranchId: branchId,
    branches: [{ id: branchId, name: "หลัก", createdAt: now }],
    memoryCards: [],
    settings: { ...DEFAULT_SETTINGS(), ...input.settings },
    summary: "",
    turnCount: 0,
    createdAt: now,
    updatedAt: now,
    scenarioId: input.scenarioId,
  };
  return saveThread(thread);
}

export function activeMessages(thread: PlayThread): PlayMessage[] {
  return thread.messages.filter((m) => m.branchId === thread.activeBranchId);
}

export function setLastRead(threadId: string, messageId: string) {
  const t = getThread(threadId);
  if (!t) return;
  saveThread({ ...t, lastReadMessageId: messageId });
}

export function updateSettings(threadId: string, patch: Partial<ThreadSettings>) {
  const t = getThread(threadId);
  if (!t) return;
  saveThread({ ...t, settings: { ...t.settings, ...patch } });
}

export function upsertMemory(threadId: string, card: MemoryCard) {
  const t = getThread(threadId);
  if (!t) return;
  const idx = t.memoryCards.findIndex((c) => c.id === card.id);
  const cards = [...t.memoryCards];
  if (idx >= 0) cards[idx] = card;
  else cards.push(card);
  saveThread({ ...t, memoryCards: cards });
}

export function deleteMemory(threadId: string, cardId: string) {
  const t = getThread(threadId);
  if (!t) return;
  saveThread({ ...t, memoryCards: t.memoryCards.filter((c) => c.id !== cardId) });
}
