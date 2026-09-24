import type { CoarseClient } from "@/lib/telemetry-types";

/**
 * Parse User-Agent into coarse device/OS/browser only.
 * Never store or return the raw UA string (Emmy PASS).
 */
export function parseCoarseClient(ua: string | null | undefined): CoarseClient {
  const s = (ua ?? "").toLowerCase();
  if (!s) return { device: "unknown", os: "unknown", browser: "unknown" };

  let os = "unknown";
  if (s.includes("android")) os = "android";
  else if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) os = "ios";
  else if (s.includes("mac os") || s.includes("macintosh")) os = "macos";
  else if (s.includes("windows")) os = "windows";
  else if (s.includes("linux")) os = "linux";
  else if (s.includes("cros")) os = "chromeos";

  let device = "desktop";
  if (s.includes("ipad") || s.includes("tablet")) device = "tablet";
  else if (
    s.includes("mobi") ||
    s.includes("iphone") ||
    s.includes("android")
  ) {
    device = "mobile";
  }

  let browser = "other";
  if (s.includes("edg/") || s.includes("edgios") || s.includes("edga")) browser = "edge";
  else if (s.includes("chrome") || s.includes("crios")) browser = "chrome";
  else if (s.includes("firefox") || s.includes("fxios")) browser = "firefox";
  else if (s.includes("safari") && !s.includes("chrome") && !s.includes("crios")) {
    browser = "safari";
  }

  return { device, os, browser };
}

/** Strip path of query/hash so secrets in ?key= never land in telemetry. */
export function sanitizePath(path: unknown): string | undefined {
  if (typeof path !== "string") return undefined;
  const trimmed = path.trim().slice(0, 200);
  if (!trimmed.startsWith("/")) return undefined;
  const noHash = trimmed.split("#")[0] ?? trimmed;
  const noQuery = noHash.split("?")[0] ?? noHash;
  // Block obvious secret-ish path segments
  if (/key|token|secret|password/i.test(noQuery)) {
    return noQuery.replace(/[^/]+/g, (seg) =>
      /key|token|secret|password/i.test(seg) ? "[redacted]" : seg,
    );
  }
  return noQuery.slice(0, 120) || undefined;
}

const META_BLOCK_KEYS = new Set([
  "prompt",
  "text",
  "message",
  "chat",
  "content",
  "ua",
  "useragent",
  "user_agent",
  "ip",
  "token",
  "key",
  "secret",
  "password",
  "authorization",
  "cookie",
  "balance",
  "moons",
]);

/**
 * Allow only coarse meta: reason codes, lengths, booleans, small numbers.
 * Drops prompts, balances, tokens, etc.
 */
export function sanitizeMeta(
  meta: unknown,
): Record<string, string | number | boolean> | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    const key = k.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40);
    if (!key || META_BLOCK_KEYS.has(key)) continue;
    if (key.includes("prompt") && key !== "promptlength") continue;
    if (typeof v === "boolean") {
      out[key] = v;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = Math.min(Math.max(v, -1e6), 1e6);
    } else if (typeof v === "string") {
      // reason codes / short enums only
      const s = v.trim().slice(0, 64);
      if (s && !/[\n\r]/.test(s) && s.length <= 64) out[key] = s;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Coarse opaque session id from client (short) — not an auth token. */
export function sanitizeSessionId(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return s.length >= 6 ? s : undefined;
}
