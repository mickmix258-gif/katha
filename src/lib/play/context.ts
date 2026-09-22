import { getPersona } from "./personas";
import { formatLoreBlock, selectLoreCards } from "./lore-engine";
import {
  RAW_MESSAGE_WINDOW,
  type AssembledContext,
  type PlayEntity,
  type PlayMessage,
  type PlayThread,
} from "./types";

function modeWrapper(entity: PlayEntity): string {
  switch (entity.mode) {
    case "character":
      return "โหมด: คุย 1:1 กับตัวละคร ตอบเป็นตัวละครเท่านั้น";
    case "scene":
      return "โหมด: ฉากเรื่อง มีบรรยายและ NPC ตามฉาก";
    case "world":
      return "โหมด: ท่องโลกเสรี ใช้ผู้อยู่อาศัยและตำนานโลก";
    case "multi_npc":
      return "โหมด: หลายตัวละครในเธรดเดียว ตอบสลับบทบาทเมื่อเหมาะสม";
    default:
      return "โหมด: เล่นบท";
  }
}

/**
 * Mandatory context assembly order (§ E):
 * 1 mode wrapper
 * 2 entity systemInstruction / rules
 * 3 always-on WorldCards
 * 4 triggered + semantic WorldCards
 * 5 pinned MemoryCards
 * 6 latest unpinned MemoryCards
 * 7 thread summary
 * 8 last N raw messages
 * 9 current user turn
 */
export function assembleContext(input: {
  entity: PlayEntity;
  thread: PlayThread;
  messages: PlayMessage[];
  userTurn: string;
}): AssembledContext {
  const { entity, thread, messages, userTurn } = input;
  const sections: AssembledContext["sections"] = [];

  sections.push({ key: "mode", label: "1. mode wrapper", text: modeWrapper(entity) });

  const rules = [
    entity.systemInstruction,
    entity.personality ? `บุคลิก: ${entity.personality}` : "",
    entity.speakingStyle ? `วิธีพูด: ${entity.speakingStyle}` : "",
    entity.premise ? `บทนำ: ${entity.premise}` : "",
    entity.setting ? `ฉาก: ${entity.setting}` : "",
    entity.tone ? `โทน: ${entity.tone}` : "",
    entity.playerRole ? `บทบาทผู้เล่น: ${entity.playerRole}` : "",
    entity.npcNames.length ? `NPC: ${entity.npcNames.join(", ")}` : "",
    entity.lore ? `ตำนาน: ${entity.lore}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  if (rules) {
    sections.push({ key: "rules", label: "2. system / rules", text: rules });
  }

  const persona = getPersona(thread.settings.personaId);
  sections.push({
    key: "persona",
    label: "persona",
    text: `ตัวตนผู้เล่น: ${persona.name}\nหน้าตา: ${persona.appearance}\nบุคลิก: ${persona.personality}${
      persona.privateNotes ? `\nโน้ตส่วนตัว: ${persona.privateNotes}` : ""
    }`,
  });

  const loreResult = selectLoreCards({ cards: entity.loreCards, messages });
  const alwaysOn = loreResult.selected.filter((c) => c.alwaysOn);
  const triggered = loreResult.selected.filter((c) => !c.alwaysOn);

  if (alwaysOn.length) {
    sections.push({
      key: "lore-always",
      label: "3. always-on WorldCards",
      text: formatLoreBlock(alwaysOn),
    });
  }
  if (triggered.length) {
    sections.push({
      key: "lore-triggered",
      label: "4. triggered + semantic WorldCards",
      text: formatLoreBlock(triggered),
    });
  }

  const pinned = thread.memoryCards.filter((m) => m.pinned);
  const unpinned = thread.memoryCards
    .filter((m) => !m.pinned)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  if (pinned.length) {
    sections.push({
      key: "mem-pinned",
      label: "5. pinned MemoryCards",
      text: pinned.map((m) => `📌 ${m.title}\n${m.body}`).join("\n\n"),
    });
  }
  if (unpinned.length) {
    sections.push({
      key: "mem-recent",
      label: "6. latest unpinned MemoryCards",
      text: unpinned.map((m) => `${m.title}\n${m.body}`).join("\n\n"),
    });
  }

  if (thread.summary) {
    sections.push({ key: "summary", label: "7. thread summary", text: thread.summary });
  }

  const windowMsgs = messages.slice(-RAW_MESSAGE_WINDOW);
  if (windowMsgs.length) {
    sections.push({
      key: "raw",
      label: "8. last N raw messages",
      text: windowMsgs.map((m) => `${m.role}: ${m.content}`).join("\n"),
    });
  }

  sections.push({ key: "user", label: "9. current user turn", text: userTurn });

  if (thread.settings.innerMonologue) {
    sections.push({
      key: "monologue-flag",
      label: "inner monologue",
      text: "เปิดบทในใจ: รวมบล็อกความคิดสั้นก่อนบทพูด",
    });
  }

  sections.push({
    key: "style",
    label: "style knobs",
    text: `ความยาว=${thread.settings.responseLength}; อุณหภูมิ=${thread.settings.temperature}; โทน=${thread.settings.tone}; โมเดล=${thread.settings.modelId}`,
  });

  const promptText = sections.map((s) => `### ${s.label}\n${s.text}`).join("\n\n");
  return {
    sections,
    injectedLoreIds: loreResult.selected.map((c) => c.id),
    promptText,
  };
}
