import { NextResponse } from "next/server";
import { authStatusPublic } from "@/lib/auth-status";

export const runtime = "nodejs";

/** Public: which OAuth providers are configured (no secrets). */
export async function GET() {
  return NextResponse.json({ ok: true, auth: authStatusPublic() });
}
