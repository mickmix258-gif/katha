import { NextResponse } from "next/server";
import { auth, authEnforced } from "@/auth";
import { authStatusPublic } from "@/lib/auth-status";
import { claimDailyServer } from "@/lib/server/wallet";

export const runtime = "nodejs";

/**
 * POST /api/wallet/daily-claim — grant daily moons server-side (once per local day).
 * No client-forged balance increase: only this path (and image spend) mutates moons
 * when auth is configured. Mock top-up is disabled in server mode.
 */
export async function POST() {
  const status = authStatusPublic();

  if (!authEnforced()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "auth_not_configured",
        messageTh: "ระบบเข้าสู่ระบบยังไม่พร้อม — ไม่สามารถรับโบนัสบนเซิร์ฟเวอร์ได้",
        auth: status,
      },
      { status: 503 },
    );
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      {
        ok: false,
        reason: "unauthorized",
        messageTh: "กรุณาเข้าสู่ระบบก่อนรับโบนัสรายวัน",
        auth: status,
      },
      { status: 401 },
    );
  }

  const result = await claimDailyServer(userId);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: result.reason,
        balance: result.balance,
        messageTh: "รับโบนัสวันนี้ไปแล้ว — กลับมาใหม่พรุ่งนี้",
        backend: result.backend,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    amount: result.amount,
    balance: result.balance,
    backend: result.backend,
    messageTh: `รับโบนัส +${result.amount} แล้ว`,
  });
}
