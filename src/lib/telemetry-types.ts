/**
 * Public → server telemetry event types (M8).
 * Stored payload is intentionally coarse — never raw IP, full UA, prompts, or secrets.
 */

export const TELEMETRY_EVENT_TYPES = [
  "page_view",
  "image_generate_ok",
  "image_generate_fail",
  "studio_open",
  "login_view",
  "wallet_open",
] as const;

export type TelemetryEventType = (typeof TELEMETRY_EVENT_TYPES)[number];

export function isTelemetryEventType(v: unknown): v is TelemetryEventType {
  return (
    typeof v === "string" &&
    (TELEMETRY_EVENT_TYPES as readonly string[]).includes(v)
  );
}

/** Coarse client hints only (Emmy PASS). */
export type CoarseClient = {
  /** e.g. mobile | desktop | tablet | unknown */
  device?: string;
  /** e.g. ios | android | windows | macos | linux | unknown */
  os?: string;
  /** e.g. chrome | firefox | safari | edge | other */
  browser?: string;
};

/**
 * Stored event — FORBIDDEN fields: raw IP, full UA, chat/prompts, keys/tokens,
 * full moon balances of others.
 */
export type StoredTelemetryEvent = {
  id: string;
  type: TelemetryEventType;
  /** Route path only, e.g. /studio — no query secrets. */
  path?: string;
  /** Opaque coarse session id (short hash), not a real auth session token. */
  sessionId?: string;
  client?: CoarseClient;
  /** Safe meta only: reason codes, promptLength, ok/fail flags — never prompt text. */
  meta?: Record<string, string | number | boolean>;
  ts: string;
};

export const TELEMETRY_RING_LIMIT = 1000;
