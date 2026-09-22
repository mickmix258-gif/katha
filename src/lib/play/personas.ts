"use client";

import type { Persona } from "./types";

const KEY = "katha.personas.v1";

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "persona-default",
    name: "ฉัน",
    appearance: "ตามบทบาทในฉาก",
    personality: "เปิดใจ ตอบตรง",
    privateNotes: "",
    isDefault: true,
  },
  {
    id: "persona-quiet",
    name: "เงียบขรึม",
    appearance: "เสื้อเข้ม ท่าทางสงบ",
    personality: "พูดน้อย สังเกตเก่ง",
    privateNotes: "",
  },
];

export function readPersonas(): Persona[] {
  if (typeof window === "undefined") return DEFAULT_PERSONAS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PERSONAS;
    const parsed = JSON.parse(raw) as Persona[];
    return parsed.length ? parsed : DEFAULT_PERSONAS;
  } catch {
    return DEFAULT_PERSONAS;
  }
}

export function writePersonas(list: Persona[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("katha-personas"));
}

export function getPersona(id: string): Persona {
  return readPersonas().find((p) => p.id === id) ?? DEFAULT_PERSONAS[0];
}

export function upsertPersona(persona: Persona) {
  const list = readPersonas();
  const idx = list.findIndex((p) => p.id === persona.id);
  if (idx >= 0) list[idx] = persona;
  else list.push(persona);
  writePersonas(list);
}
