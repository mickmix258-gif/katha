/**
 * Browser-side telemetry beacon (fire-and-forget).
 * Never sends prompts, chat text, keys, tokens, balances, or raw IP/UA.
 */

import type { TelemetryEventType } from "@/lib/telemetry-types";

const SESSION_KEY = "katha.tel.sid";

function coarseSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id || id.length < 6) {
      id = `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id.slice(0, 24);
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

export type TrackMeta = Record<string, string | number | boolean>;

/**
 * Send a coarse event to POST /api/telemetry/event.
 * Errors are swallowed — never block UX.
 */
export function trackEvent(
  type: TelemetryEventType,
  opts?: { path?: string; meta?: TrackMeta },
): void {
  if (typeof window === "undefined") return;
  try {
    const path =
      opts?.path ??
      (typeof window.location?.pathname === "string"
        ? window.location.pathname
        : undefined);
    const body = JSON.stringify({
      type,
      path: path?.split("?")[0]?.split("#")[0]?.slice(0, 120),
      sessionId: coarseSessionId(),
      ...(opts?.meta ? { meta: opts.meta } : {}),
    });
    void fetch("/api/telemetry/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}
