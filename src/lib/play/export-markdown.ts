import type { PlayMessage, PlayThread } from "./types";
import { activeMessages } from "./thread-store";

export function threadToMarkdown(thread: PlayThread, messages?: PlayMessage[]): string {
  const msgs = messages ?? activeMessages(thread);
  const lines = [
    `# ${thread.entityTitle}`,
    "",
    `- โหมด: ${thread.mode}`,
    `- เธรด: ${thread.id}`,
    `- อัปเดต: ${thread.updatedAt}`,
    "",
    "## บท",
    "",
  ];
  for (const m of msgs) {
    const who =
      m.role === "user"
        ? "ผู้เล่น"
        : m.role === "narrator"
          ? "บรรยาย"
          : m.role === "system"
            ? "ระบบ"
            : thread.entityTitle;
    lines.push(`### ${who}`);
    if (m.monologue) {
      lines.push(`*(ในใจ)* ${m.monologue}`);
      lines.push("");
    }
    lines.push(m.content);
    lines.push("");
  }
  if (thread.memoryCards.length) {
    lines.push("## ใบจำ", "");
    for (const c of thread.memoryCards) {
      lines.push(`### ${c.pinned ? "📌 " : ""}${c.title}`);
      lines.push(c.body);
      lines.push("");
    }
  }
  if (thread.summary) {
    lines.push("## สรุป", "", thread.summary, "");
  }
  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
