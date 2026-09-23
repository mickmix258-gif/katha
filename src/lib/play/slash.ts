export type SlashResult =
  | { kind: "reset" }
  | { kind: "summary" }
  | { kind: "memory"; n: number }
  | { kind: "note"; text: string }
  | { kind: "image"; prompt: string }
  | { kind: "unknown"; raw: string }
  | null;

/** Parse leading slash command. Returns null if not a command. */
export function parseSlash(input: string): SlashResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const [cmd, ...rest] = trimmed.slice(1).split(/\s+/);
  const arg = rest.join(" ").trim();
  switch (cmd.toLowerCase()) {
    case "reset":
      return { kind: "reset" };
    case "summary":
      return { kind: "summary" };
    case "memory": {
      const n = arg ? Number.parseInt(arg, 10) : 8;
      return { kind: "memory", n: Number.isFinite(n) && n > 0 ? n : 8 };
    }
    case "note":
      return { kind: "note", text: arg || "โน้ตว่าง" };
    case "image":
      return { kind: "image", prompt: arg };
    default:
      return { kind: "unknown", raw: trimmed };
  }
}
