"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import th from "@/locales/th.json";
import { computeStudioStats, type StudioStats } from "@/lib/studio-stats";
import { LOCAL_CREATOR } from "@/lib/user-works-store";
import {
  getCreatorBalance,
  ledgerLabelTh,
  readLedger,
  type LedgerEntry,
} from "@/lib/wallet-store";

export default function StudioEarningsPage() {
  const [stats, setStats] = useState<StudioStats | null>(null);
  const [tips, setTips] = useState<LedgerEntry[]>([]);
  const [held, setHeld] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const s = computeStudioStats(LOCAL_CREATOR);
      setStats(s);
      setHeld(getCreatorBalance(LOCAL_CREATOR));
      setTips(
        readLedger().filter(
          (e) => e.type === "tip_in" && (e.counterparty === LOCAL_CREATOR || !e.counterparty),
        ),
      );
    };
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-wallet", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-wallet", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  if (!stats) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังโหลดรายได้…</div>
    );
  }

  const shareOnly = Math.max(
    0,
    stats.earningsMoons - stats.tipReceived - stats.balanceHeld,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/studio" className="text-sm text-[var(--accent-2)]">
        ← สตูดิโอ
      </Link>
      <p className="mt-4 text-xs tracking-[0.3em] text-[var(--accent-2)]">M5 · EARNINGS</p>
      <h1 className="mt-2 text-3xl">รายได้ครีเอเตอร์</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        @{stats.handle} · ม็อกส่วนแบ่ง — ไม่มีการถอนเงินจริง
      </p>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <p className="text-xs text-[var(--muted)]">รายได้รวม (stub)</p>
        <p className="mt-2 text-5xl tabular-nums text-[var(--accent-2)]">
          {stats.earningsMoons.toLocaleString("th-TH")}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">พระจันทร์</p>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <dt className="text-xs text-[var(--muted)]">{th.wallet.creatorShare}</dt>
          <dd className="mt-1 text-2xl tabular-nums">{stats.creatorSharePercent}%</dd>
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            จากยอดมองเห็นซีด ≈ {shareOnly.toLocaleString("th-TH")} พระจันทร์
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <dt className="text-xs text-[var(--muted)]">ทิปที่ได้รับ</dt>
          <dd className="mt-1 text-2xl tabular-nums">{stats.tipReceived}</dd>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <dt className="text-xs text-[var(--muted)]">ยอดถือของครีเอเตอร์</dt>
          <dd className="mt-1 text-2xl tabular-nums">{held}</dd>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <dt className="text-xs text-[var(--muted)]">การมองเห็น</dt>
          <dd className="mt-1 text-2xl tabular-nums">
            {stats.impressions.toLocaleString("th-TH")}
          </dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="text-xl">ทิปเข้า</h2>
        {!tips.length ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            ยังไม่มีทิปเข้า — ผู้อ่านส่งพระจันทร์จากโปรไฟล์ครีเอเตอร์ได้
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tips.map((e) => (
              <li
                key={e.id}
                className="flex justify-between rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
              >
                <div>
                  <p>{ledgerLabelTh(e.type)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(e.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
                <p className="tabular-nums text-[var(--accent-2)]">+{e.amount}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
