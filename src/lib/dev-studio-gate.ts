import { auth, authEnforced } from "@/auth";
import { isAuthConfigured } from "@/lib/auth-status";

/**
 * Gate for /dev/studio and GET /api/telemetry/events.
 * Emmy PASS: unauthenticated cannot enter.
 * Access when:
 *   1) DEV_STUDIO_KEY is set AND request supplies matching ?key= or x-dev-studio-key, OR
 *   2) Auth is configured AND caller has a valid team/session login.
 * If DEV_STUDIO_KEY env is unset and auth is not usable → not configured (no raw events).
 */

export type DevStudioGateResult =
  | { ok: true; via: "key" | "session" }
  | {
      ok: false;
      reason: "not_configured" | "unauthorized" | "forbidden";
      messageTh: string;
      status: number;
    };

export function isDevStudioKeyConfigured(): boolean {
  return Boolean(process.env.DEV_STUDIO_KEY?.trim());
}

function keyMatches(provided: string | null | undefined): boolean {
  const expected = process.env.DEV_STUDIO_KEY?.trim();
  if (!expected || !provided) return false;
  // Constant-time-ish compare for short secrets
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export function extractDevStudioKey(req: Request): string | null {
  const header = req.headers.get("x-dev-studio-key")?.trim();
  if (header) return header;
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("key")?.trim();
    if (q) return q;
  } catch {
    /* ignore */
  }
  return null;
}

export async function assertDevStudioAccess(
  req: Request,
): Promise<DevStudioGateResult> {
  const keyConfigured = isDevStudioKeyConfigured();
  const authOk = isAuthConfigured() && authEnforced();

  if (!keyConfigured && !authOk) {
    return {
      ok: false,
      reason: "not_configured",
      messageTh:
        "สตูดิโอผู้พัฒนายังไม่ได้ตั้งค่า — ต้องตั้ง DEV_STUDIO_KEY หรือเปิดระบบเข้าสู่ระบบทีมก่อน",
      status: 503,
    };
  }

  if (keyConfigured && keyMatches(extractDevStudioKey(req))) {
    return { ok: true, via: "key" };
  }

  if (authOk) {
    const session = await auth();
    if (session?.user?.id) {
      return { ok: true, via: "session" };
    }
  }

  return {
    ok: false,
    reason: "unauthorized",
    messageTh:
      "ต้องใส่รหัสสตูดิโอผู้พัฒนา หรือเข้าสู่ระบบทีมก่อนจึงจะดูข้อมูลได้",
    status: 401,
  };
}

/** Page-level gate using query key + optional session (no Request body). */
export async function assertDevStudioPageAccess(opts: {
  queryKey?: string | null;
}): Promise<DevStudioGateResult> {
  const keyConfigured = isDevStudioKeyConfigured();
  const authOk = isAuthConfigured() && authEnforced();

  if (!keyConfigured && !authOk) {
    return {
      ok: false,
      reason: "not_configured",
      messageTh:
        "สตูดิโอผู้พัฒนายังไม่ได้ตั้งค่า — ตั้งค่า DEV_STUDIO_KEY บนเซิร์ฟเวอร์ (ดู docs/M8_ENV_CHECKLIST.md) หรือเปิด OAuth ทีม",
      status: 503,
    };
  }

  if (keyConfigured && keyMatches(opts.queryKey)) {
    return { ok: true, via: "key" };
  }

  if (authOk) {
    const session = await auth();
    if (session?.user?.id) {
      return { ok: true, via: "session" };
    }
  }

  return {
    ok: false,
    reason: "unauthorized",
    messageTh:
      "ต้องใส่รหัสผ่านสตูดิโอผู้พัฒนา (?key=) หรือเข้าสู่ระบบด้วยบัญชีทีม",
    status: 401,
  };
}
