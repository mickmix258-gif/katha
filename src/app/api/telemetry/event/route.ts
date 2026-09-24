import { NextResponse } from "next/server";
import { getClientIp, rateLimitTelemetry } from "@/lib/rate-limit";
import {
  parseCoarseClient,
  sanitizeMeta,
  sanitizePath,
  sanitizeSessionId,
} from "@/lib/telemetry-client-info";
import { appendTelemetryEvent } from "@/lib/telemetry-store";
import { isTelemetryEventType } from "@/lib/telemetry-types";

export const runtime = "nodejs";

type Body = {
  type?: unknown;
  path?: unknown;
  meta?: unknown;
  sessionId?: unknown;
};

/**
 * POST /api/telemetry/event
 * Public ingest — fire-and-forget from browser.
 * Stores ONLY coarse fields (Emmy PASS): type, path, coarse session id,
 * coarse device/OS/browser, safe meta (reason codes / lengths).
 * FORBIDDEN in storage: raw IP, full UA, prompts/chat, keys/tokens.
 * IP is read solely for rate-limiting and discarded.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimitTelemetry(ip);
  if (!rl.success) {
    return NextResponse.json(
      {
        ok: false,
        reason: "rate_limited",
        messageTh: "ส่งเหตุการณ์ถี่เกินไป — รอสักครู่",
        retryAfterSec: rl.retryAfterSec,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad_request", messageTh: "JSON ไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (!isTelemetryEventType(body.type)) {
    return NextResponse.json(
      { ok: false, reason: "bad_type", messageTh: "ประเภทเหตุการณ์ไม่รองรับ" },
      { status: 400 },
    );
  }

  // Coarse UA parse only — raw UA never stored
  const client = parseCoarseClient(req.headers.get("user-agent"));
  const path = sanitizePath(body.path);
  const sessionId = sanitizeSessionId(body.sessionId);
  const meta = sanitizeMeta(body.meta);

  const event = {
    id: `te_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: body.type,
    ...(path ? { path } : {}),
    ...(sessionId ? { sessionId } : {}),
    client,
    ...(meta ? { meta } : {}),
    ts: new Date().toISOString(),
  };

  const { backend } = await appendTelemetryEvent(event);

  return NextResponse.json({ ok: true, backend });
}
