import { newId } from "@/lib/user-works-store";
import { MEMORY_AUTO_EVERY_TURNS, type MemoryCard, type PlayMessage } from "./types";

/** Build a short auto memory card from recent turns. */
export function buildAutoMemoryCard(
  messages: PlayMessage[],
  turnCount: number,
): MemoryCard | null {
  if (turnCount <= 0 || turnCount % MEMORY_AUTO_EVERY_TURNS !== 0) return null;
  const recent = messages.slice(-12);
  const userBits = recent.filter((m) => m.role === "user").map((m) => m.content);
  const asstBits = recent
    .filter((m) => m.role === "assistant" || m.role === "narrator")
    .map((m) => m.content);
  const lastUser = userBits[userBits.length - 1] ?? "";
  const lastAsst = asstBits[asstBits.length - 1] ?? "";
  const title = `ความจำรอบที่ ${turnCount}`;
  const body = [
    lastUser ? `ผู้เล่น: ${clip(lastUser, 120)}` : "",
    lastAsst ? `เรื่อง: ${clip(lastAsst, 160)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  if (!body) return null;
  return {
    id: newId("mem"),
    title,
    body,
    pinned: false,
    createdAt: new Date().toISOString(),
    turnIndex: turnCount,
  };
}

export function buildManualMemory(
  messages: PlayMessage[],
  lastN: number,
  turnCount: number,
): MemoryCard {
  const slice = messages.slice(-Math.max(1, lastN));
  const body = slice
    .map((m) => `${roleLabel(m.role)}: ${clip(m.content, 100)}`)
    .join("\n");
  return {
    id: newId("mem"),
    title: `ใบจำมือ · ${lastN} ข้อความ`,
    body,
    pinned: false,
    createdAt: new Date().toISOString(),
    turnIndex: turnCount,
  };
}

export function buildSummary(messages: PlayMessage[], existing: string): string {
  const recent = messages.slice(-20);
  const lines = recent.map((m) => `- ${roleLabel(m.role)}: ${clip(m.content, 80)}`);
  const block = lines.join("\n");
  if (!existing) return `สรุปบท (stub):\n${block}`;
  return `${existing}\n\n— อัปเดต —\n${block}`;
}

function roleLabel(role: string) {
  if (role === "user") return "ผู้เล่น";
  if (role === "assistant") return "ตัวละคร";
  if (role === "narrator") return "บรรยาย";
  return role;
}

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}
