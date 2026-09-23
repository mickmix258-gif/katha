"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setWallet(readWallet());
    setLedger(readUserLedger());
  };

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-wallet", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-wallet", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  if (!wallet) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังโหลดกระเป๋า…</div>
    );
  }

  const claimable = canClaimDaily(wallet);
  const grant = dailyGrantAmount(wallet);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M5 · WALLET</p>
      <h1 className="mt-2 text-3xl">{th.nav.wallet}พระจันทร์</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        ม็อกในเครื่อง (localStorage: katha.wallet.v1 / katha.ledger.v1) — ไม่ใช่การชำระเงินจริง
      </p>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <p className="text-xs text-[var(--muted)]">{th.wallet.balance}</p>
        <p className="mt-2 text-5xl tabular-nums">{wallet.balance}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          แผน {wallet.plan === "plus" ? "Plus" : "ฟรี"} · โบนัสรายวัน {grant} พระจันทร์
        </p>
        <button
          type="button"
          disabled={!claimable}
          onClick={() => {
            setError(null);
            setNotice(null);
            const r = claimDaily();
            if (!r.ok) {
              setError("รับโบนัสวันนี้ไปแล้ว — กลับมาใหม่พรุ่งนี้");
              return;
            }
            setNotice(`รับโบนัส +${r.amount} แล้ว · ยอด ${r.balance}`);
            refresh();
          }}
          className="mt-5 rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {claimable ? `รับโบนัสรายวัน (+${grant})` : "รับแล้ววันนี้"}
        </button>
        {wallet.lastDailyClaimDate ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            รับล่าสุด: {wallet.lastDailyClaimDate}
          </p>
        ) : null}
      </div>

      {notice ? <p className="mt-4 text-sm text-[var(--accent-2)]">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <section className="mt-10">
        <h2 className="text-xl">{th.wallet.topup}ม็อก</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          ปุ่มจำลองเท่านั้น — ไม่มี Stripe / PromptPay
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
                refresh();
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-left transition hover:border-[var(--accent)]"
            >
              <p className="text-2xl tabular-nums">{pack.moons}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{pack.priceLabel}</p>
            </button>
          ))}
        </div>
      </section>

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
