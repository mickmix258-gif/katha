"use client";

export function SandboxStub({ entityName }: { entityName: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-5">
      <p className="text-xs tracking-[0.25em] text-[var(--accent-2)]">SANDBOX · M4</p>
      <h3 className="mt-2 text-lg">ทดลองคุยกับ {entityName || "ผลงาน"}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">
        ห้องแชทสตรีมจะมาในไมล์สโตน 4 — ตอนนี้เป็น stub เพื่อยืนยันเส้นทางเผยแพร่ก่อนเชื่อมโมเดล
      </p>
      <div className="mt-4 space-y-2 rounded-xl bg-[var(--ink)] p-4 text-sm text-[var(--muted)]">
        <p>คุณ: สวัสดี…</p>
        <p className="text-[var(--accent-2)]">{entityName || "ตัวละคร"}: (รอห้องบท M4)</p>
      </div>
      <button
        type="button"
        disabled
        className="mt-4 rounded-full border border-[var(--line)] px-4 py-2 text-sm opacity-50"
      >
        ส่ง · เร็ว ๆ นี้
      </button>
    </div>
  );
}
