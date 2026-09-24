import { NextResponse } from "next/server";
import { assertDevStudioAccess } from "@/lib/dev-studio-gate";
import {
  countTelemetryByType,
  listTelemetryEvents,
  telemetryStorageInfo,
} from "@/lib/telemetry-store";

export const runtime = "nodejs";

/**
 * GET /api/telemetry/events
 * Developer studio only — gated by DEV_STUDIO_KEY (?key= / x-dev-studio-key)
 * or authenticated team session. Unauthenticated → 401.
 */
export async function GET(req: Request) {
  const gate = await assertDevStudioAccess(req);
  if (!gate.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: gate.reason,
        messageTh: gate.messageTh,
      },
      { status: gate.status },
    );
  }

  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 100;

  const [{ events, backend }, { counts, total }, info] = await Promise.all([
    listTelemetryEvents(limit),
    countTelemetryByType(),
    Promise.resolve(telemetryStorageInfo()),
  ]);

  return NextResponse.json({
    ok: true,
    via: gate.via,
    backend,
    ringLimit: info.ringLimit,
    total,
    counts,
    events,
  });
}
