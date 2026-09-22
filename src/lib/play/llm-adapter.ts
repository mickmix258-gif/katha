import type { AssembledContext, PlayEntity, PlayThread, ResponseLength } from "./types";

export type StreamChunk = {
  type: "monologue" | "content" | "done";
  text?: string;
};

export type LlmStreamRequest = {
  entity: PlayEntity;
  thread: PlayThread;
  context: AssembledContext;
  userTurn: string;
  signal?: AbortSignal;
};

/**
 * Provider interface — swap MockLlmAdapter for a real HTTP SSE provider later.
 */
export interface LlmAdapter {
  stream(req: LlmStreamRequest): AsyncGenerator<StreamChunk, void, unknown>;
}

function lengthTarget(len: ResponseLength): number {
  if (len === "short") return 90;
  if (len === "long") return 280;
  return 160;
}

function pickSpeaker(entity: PlayEntity): string {
  if (entity.mode === "multi_npc" && entity.npcNames.length > 1) {
    const i = Math.floor(Math.random() * entity.npcNames.length);
    return entity.npcNames[i] ?? entity.title;
  }
  return entity.npcNames[0] ?? entity.title;
}

function craftReply(req: LlmStreamRequest): { monologue?: string; content: string } {
  const { entity, thread, context, userTurn } = req;
  const speaker = pickSpeaker(entity);
  const loreHint = context.injectedLoreIds.length
    ? context.sections.find((s) => s.key === "lore-triggered" || s.key === "lore-always")?.text
    : "";
  const loreLine = loreHint
    ? clip(loreHint.split("\n").find((l) => l && !l.startsWith("[")) ?? "", 60)
    : "";

  const temp = thread.settings.temperature;
  const spice =
    temp > 0.8 ? "น้ำเสียงร้อนขึ้นเล็กน้อย" : temp < 0.4 ? "น้ำเสียงเย็นและชัด" : "น้ำเสียงสมดุล";

  const target = lengthTarget(thread.settings.responseLength);
  const base =
    entity.mode === "scene" || entity.mode === "world" || entity.mode === "multi_npc"
      ? craftSceneStyle(speaker, userTurn, loreLine, spice, entity)
      : craftCharacterStyle(speaker, userTurn, loreLine, spice, entity);

  let content = base;
  while (content.length < target * 0.6) {
    content += ` ${speaker}ยังมองคุณค้างไว้ รอคำถัดไปโดยไม่รีบปิดระยะ`;
    if (content.length > target) break;
  }
  if (content.length > target + 40) content = content.slice(0, target + 40) + "…";

  const monologue = thread.settings.innerMonologue
    ? `…${clip(userTurn, 40) || "คำพูดนี้"} ทำให้ใจสั่นนิด — ต้องคุมท่าทางไว้`
    : undefined;

  return { monologue, content };
}

function craftCharacterStyle(
  speaker: string,
  userTurn: string,
  loreLine: string,
  spice: string,
  entity: PlayEntity,
) {
  const style = entity.speakingStyle ? ` (${entity.speakingStyle})` : "";
  const echo = clip(userTurn, 48) || "สิ่งที่คุณเพิ่งพูด";
  const loreBit = loreLine ? ` เงารอบตัวพาดถึง「${loreLine}」` : "";
  return `${speaker}${style}: 「${echo}」 หรอ…${loreBit} ${spice} เธอ/เขาขยับเข้ามาอีกนิด แล้วตอบอย่างเป็นตัวเองโดยไม่ทิ้งบท`;
}

function craftSceneStyle(
  speaker: string,
  userTurn: string,
  loreLine: string,
  spice: string,
  entity: PlayEntity,
) {
  const setting = entity.setting ? `ใน${entity.setting}` : "ในฉากนี้";
  const loreBit = loreLine ? ` ใบโลกกระซิบว่า ${loreLine}.` : "";
  return `*${setting} แสงนิ่ง*${loreBit}\n${speaker}: ตอบต่อ「${clip(userTurn, 40) || "…"}」ด้วย${spice} — ระยะหายใจใกล้ขึ้นโดยไม่ทำลายโทน「${entity.tone || "ตามฉาก"}」`;
}

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

async function* chunkText(
  text: string,
  signal?: AbortSignal,
  delayMs = 18,
): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += 3) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    yield text.slice(i, i + 3);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

/** Deterministic stub stream — replace with real provider implementing LlmAdapter. */
export class MockLlmAdapter implements LlmAdapter {
  async *stream(req: LlmStreamRequest): AsyncGenerator<StreamChunk> {
    const { monologue, content } = craftReply(req);
    if (monologue) {
      for await (const t of chunkText(monologue, req.signal, 12)) {
        yield { type: "monologue", text: t };
      }
    }
    for await (const t of chunkText(content, req.signal, 16)) {
      yield { type: "content", text: t };
    }
    yield { type: "done" };
  }
}

let activeAdapter: LlmAdapter = new MockLlmAdapter();

/** Call from app bootstrap to inject OpenAI/Anthropic/etc. later. */
export function setLlmAdapter(adapter: LlmAdapter) {
  activeAdapter = adapter;
}

export function getLlmAdapter(): LlmAdapter {
  return activeAdapter;
}
