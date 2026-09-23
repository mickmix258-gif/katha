"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import th from "@/locales/th.json";
import { computeStudioStats, type StudioStats } from "@/lib/studio-stats";
import { LOCAL_CREATOR } from "@/lib/user-works-store";

export default function StudioPage() {
  const [stats, setStats] = useState<StudioStats | null>(null);

  useEffect(() => {
    const refresh = () => setStats(computeStudioStats(LOCAL_CREATOR));
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-wallet", on);
    window.addEventListener("katha-threads", on);
    window.addEventListener("katha-social", on);
    window.addEventListener("katha-works", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-wallet", on);
      window.removeEventListener("katha-threads", on);
      window.removeEventListener("katha-social", on);
      window.removeEventListener("katha-works", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  if (!stats) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-[var(--muted)]">กำลังโหลดสตูดิโอ…</div>
    );
  }

  const cards: { label: string; value: number; hint?: string }[] = [
    { label: "การมองเห็น", value: stats.impressions, hint: "ประมาณจากซีด + ผลงานท้องถิ่น" },
    { label: "เริ่มบท", value: stats.starts },
    { label: "ข้อความ", value: stats.messages },
    { label: "ถูกใจ", value: stats.likes },
    { label: "ผู้ติดตาม", value: stats.follows },
    { label: "ผลงานเผยแพร่", value: stats.worksPublished },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M5 · STUDIO</p>
      <h1 className="mt-2 text-3xl">{th.nav.studio}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        แดชบอร์ดครีเอเตอร์ @{stats.handle} · สถิติรวมซีด + ข้อมูลในเครื่อง
      </p>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link
          href="/studio/earnings"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-white"
        >
          รายได้
        </Link>
        <Link
          href="/studio/images"
          className="rounded-full border border-[var(--line)] px-4 py-2"
        >
          สร้างภาพ
        </Link>
        <Link href="/wallet" className="rounded-full border border-[var(--line)] px-4 py-2">
          กระเป๋า
        </Link>
        <Link href="/create" className="rounded-full border border-[var(--line)] px-4 py-2">
          สร้างผลงาน
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5"
          >
            <p className="text-xs text-[var(--muted)]">{c.label}</p>
            <p className="mt-2 text-3xl tabular-nums">{c.value.toLocaleString("th-TH")}</p>
            {c.hint ? <p className="mt-1 text-[10px] text-[var(--muted)]">{c.hint}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <p className="text-xs text-[var(--muted)]">{th.wallet.creatorShare}</p>
        <p className="mt-2 text-3xl tabular-nums text-[var(--accent-2)]">
          {stats.earningsMoons.toLocaleString("th-TH")} พระจันทร์
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          สัดส่วนครีเอเตอร์ {stats.creatorSharePercent}% (stub) · ทิปที่ได้รับ {stats.tipReceived} ·
          ยอดถือ {stats.balanceHeld}
        </p>
        <Link
          href="/studio/earnings"
          className="mt-3 inline-block text-sm text-[var(--accent-2)]"
        >
          ดูรายละเอียดรายได้ →
        </Link>
      </div>
    </div>
  );
}
