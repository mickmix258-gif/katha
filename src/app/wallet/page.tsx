"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import th from "@/locales/th.json";
import {
  canClaimDaily,
  claimDaily,
  dailyGrantAmount,
  ledgerLabelTh,
  mockPurchase,
  readUserLedger,
  readWallet,
  type LedgerEntry,
  type WalletState,
} from "@/lib/wallet-store";

const MOCK_PACKS = [
  { id: "pack-s", moons: 100, priceLabel: "฿49 ม็อก" },
  { id: "pack-m", moons: 350, priceLabel: "฿149 ม็อก" },
  { id: "pack-l", moons: 900, priceLabel: "฿299 ม็อก" },
] as const;

type ServerWalletPayload = {
  ok: boolean;
  reason?: string;
  messageTh?: string;
  auth?: { configured: boolean };
  backend?: string;
  wallet?: {
    balance: number;
    lastDailyClaimDate: string | null;
    plan: "free" | "plus";
    canClaimDaily: boolean;
    dailyGrant: number;
  };
  ledger?: LedgerEntry[];
};

export default function WalletPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [mode, setMode] = useState<"local" | "server" | "loading">("loading");
  const [authConfigured, setAuthConfigured] = useState(false);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [canClaim, setCanClaim] = useState(false);
  const [grant, setGrant] = useState(30);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<string | null>(null);

  const refreshLocal = useCallback(() => {
    const w = readWallet();
    setWallet(w);
    setLedger(readUserLedger());
    setCanClaim(canClaimDaily(w));
    setGrant(dailyGrantAmount(w));
    setMode("local");
  }, []);

  const refreshServer = useCallback(async () => {
    const res = await fetch("/api/wallet");
    const json = (await res.json()) as ServerWalletPayload;
    if (json.auth?.configured) setAuthConfigured(true);

    if (!json.ok || !json.wallet) {
      if (res.status === 401) {
        setError(json.messageTh ?? "กรุณาเข้าสู่ระบบเพื่อใช้กระเป๋าเซิร์ฟเวอร์");
        setMode("local");
        refreshLocal();
        return;
      }
      // Auth not configured — fall back to local
      setAuthConfigured(false);
      refreshLocal();
      return;
    }

    setWallet({
      balance: json.wallet.balance,
      lastDailyClaimDate: json.wallet.lastDailyClaimDate,
      plan: json.wallet.plan,
    });
    setLedger(json.ledger ?? []);
    setCanClaim(json.wallet.canClaimDaily);
    setGrant(json.wallet.dailyGrant);
    setBackend(json.backend ?? null);
    setMode("server");
    setError(null);
  }, [refreshLocal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const statusRes = await fetch("/api/auth/status");
        const statusJson = (await statusRes.json()) as {
          auth?: { configured: boolean };
        };
        const configured = Boolean(statusJson.auth?.configured);
        if (cancelled) return;
        setAuthConfigured(configured);

        if (configured && sessionStatus === "authenticated") {
          await refreshServer();
        } else if (configured && sessionStatus === "unauthenticated") {
          refreshLocal();
          setMode("local");
        } else if (sessionStatus !== "loading") {
          refreshLocal();
        }
      } catch {
        if (!cancelled) refreshLocal();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, refreshServer, refreshLocal]);

  useEffect(() => {
    const on = () => {
      if (mode === "local") refreshLocal();
    };
    window.addEventListener("katha-wallet", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-wallet", on);
      window.removeEventListener("storage", on);
    };
  }, [mode, refreshLocal]);

  if (!wallet || mode === "loading" || sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังโหลดกระเป๋า…</div>
    );
  }

  const loggedIn = Boolean(session?.user);
  const serverMode = mode === "server" && loggedIn;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M7 · WALLET</p>
      <h1 className="mt-2 text-3xl">{th.nav.wallet}พระจันทร์</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {serverMode
          ? `กระเป๋าเซิร์ฟเวอร์${backend ? ` (${backend})` : ""} — หัก/เติมบนเซิร์ฟเวอร์เท่านั้น`
          : authConfigured
            ? "ยังไม่ได้เข้าสู่ระบบ — แสดงยอดม็อกในเครื่อง · เข้าสู่ระบบเพื่อใช้กระเป๋าเซิร์ฟเวอร์"
            : "ม็อกในเครื่อง (localStorage) — OAuth ยังไม่ตั้งค่า · ไม่ใช่การชำระเงินจริง"}
      </p>

      {authConfigured && !loggedIn ? (
        <p className="mt-3 text-sm">
          <Link href="/login" className="text-[var(--accent-2)]">
            เข้าสู่ระบบ
          </Link>{" "}
          เพื่อเก็บพระจันทร์บนเซิร์ฟเวอร์
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <p className="text-xs text-[var(--muted)]">{th.wallet.balance}</p>
        <p className="mt-2 text-5xl tabular-nums">{wallet.balance}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          แผน {wallet.plan === "plus" ? "Plus" : "ฟรี"} · โบนัสรายวัน {grant} พระจันทร์
        </p>
        <button
          type="button"
          disabled={!canClaim}
          onClick={() => {
            void (async () => {
              setError(null);
              setNotice(null);
              if (serverMode) {
                const res = await fetch("/api/wallet/daily-claim", { method: "POST" });
                const json = (await res.json()) as {
                  ok: boolean;
                  amount?: number;
                  balance?: number;
                  messageTh?: string;
                };
                if (!json.ok) {
                  setError(json.messageTh ?? "รับโบนัสไม่สำเร็จ");
                  return;
                }
                setNotice(json.messageTh ?? `รับโบนัส +${json.amount} แล้ว`);
                await refreshServer();
                return;
              }
              const r = claimDaily();
              if (!r.ok) {
                setError("รับโบนัสวันนี้ไปแล้ว — กลับมาใหม่พรุ่งนี้");
                return;
              }
              setNotice(`รับโบนัส +${r.amount} แล้ว · ยอด ${r.balance}`);
              refreshLocal();
            })();
          }}
          className="mt-5 rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {canClaim ? `รับโบนัสรายวัน (+${grant})` : "รับแล้ววันนี้"}
        </button>
        {wallet.lastDailyClaimDate ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            รับล่าสุด: {wallet.lastDailyClaimDate}
          </p>
        ) : null}
      </div>

      {notice ? <p className="mt-4 text-sm text-[var(--accent-2)]">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {/* Mock top-up only in local mode — server mode forbids forged moon increases */}
      {!serverMode ? (
        <section className="mt-10">
          <h2 className="text-xl">{th.wallet.topup}ม็อก</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            ปุ่มจำลองเท่านั้น — ไม่มี Stripe / PromptPay
            {authConfigured ? " · ปิดเมื่อใช้กระเป๋าเซิร์ฟเวอร์" : ""}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {MOCK_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => {
                  mockPurchase(pack.id, pack.moons, pack.priceLabel);
                  setNotice(`เติมม็อก +${pack.moons} (${pack.priceLabel})`);
                  setError(null);
                  refreshLocal();
                }}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-left transition hover:border-[var(--accent)]"
              >
                <p className="text-2xl tabular-nums">{pack.moons}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{pack.priceLabel}</p>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
          การเติมพระจันทร์จริงยังไม่เปิด — รับได้เฉพาะโบนัสรายวันบนเซิร์ฟเวอร์
          (ไม่สามารถปลอมคำขอเพื่อเพิ่มยอดได้)
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl">{th.wallet.ledger}</h2>
          <Link href="/studio" className="text-sm text-[var(--accent-2)]">
            สตูดิโอ →
          </Link>
        </div>
        {!ledger.length ? (
          <p className="mt-4 text-sm text-[var(--muted)]">ยังไม่มีรายการ — รับโบนัสหรือสร้างภาพเพื่อเริ่ม</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {ledger.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{ledgerLabelTh(e.type)}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {e.note || e.type}
                    {e.counterparty ? ` · @${e.counterparty}` : ""}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    {new Date(e.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`tabular-nums ${
                      e.amount >= 0 ? "text-[var(--accent-2)]" : "text-red-300"
                    }`}
                  >
                    {e.amount >= 0 ? `+${e.amount}` : e.amount}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">คงเหลือ {e.balanceAfter}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
