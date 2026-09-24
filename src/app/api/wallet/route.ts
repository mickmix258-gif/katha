import { NextResponse } from "next/server";
import { auth, authEnforced } from "@/auth";
import { authStatusPublic } from "@/lib/auth-status";
import {
  canClaimDaily,
  dailyGrantAmount,
  getServerWallet,
} from "@/lib/server/wallet";

export const runtime = "nodejs";

/**
 * GET /api/wallet — server moon balance for the authenticated user.
 * Requires session when auth is configured.
 */
export async function GET() {
  const status = authStatusPublic();

  if (!authEnforced()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "auth_not_configured",
        messageTh:
          "ระบบเข้าสู่ระบบยังไม่พร้อม — กระเป๋าเซิร์ฟเวอร์ใช้ได้เมื่อตั้งค่า OAuth แล้ว",
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
        messageTh: "กรุณาเข้าสู่ระบบเพื่อดูกระเป๋าพระจันทร์",
        auth: status,
      },
      { status: 401 },
    );
  }

  const { wallet, backend } = await getServerWallet(userId);
  const userLedger = wallet.ledger.filter((e) => e.type !== "tip_in");

  return NextResponse.json({
    ok: true,
    auth: status,
    backend,
    wallet: {
      balance: wallet.balance,
      lastDailyClaimDate: wallet.lastDailyClaimDate,
      plan: wallet.plan,
      canClaimDaily: canClaimDaily(wallet),
      dailyGrant: dailyGrantAmount(wallet.plan),
    },
    ledger: userLedger,
    user: {
      id: userId,
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? null,
      image: session?.user?.image ?? null,
    },
  });
}
