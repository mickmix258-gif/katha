"use client";

import Link from "next/link";

export function SandboxStub({
  entityName,
  playHref,
}: {
  entityName: string;
  playHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-5">
      <p className="text-xs tracking-[0.25em] text-[var(--accent-2)]">SANDBOX · M4</p>
      <h3 className="mt-2 text-lg">ทดลองคุยกับ {entityName || "ผลงาน"}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">
        ห้องบทสตรีมพร้อมแล้ว — เปิดเล่นเพื่อทดสอบคำทักทาย ใบโลก และใบจำ
      </p>
      <div className="mt-4 space-y-2 rounded-xl bg-[var(--ink)] p-4 text-sm text-[var(--muted)]">
        <p>คุณ: สวัสดี…</p>
        <p className="text-[var(--accent-2)]">{entityName || "ตัวละคร"}: (เปิดห้องบทเพื่อคุยจริง)</p>
      </div>
      {playHref ? (
        <Link
          href={playHref}
          className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
        >
          เปิดห้องบท
        </Link>
      ) : (
        <p className="mt-4 text-xs text-[var(--muted)]">บันทึกผลงานก่อน แล้วเปิดจากหน้ารายละเอียด</p>
      )}
    </div>
  );
}
