"use client";

import { useState } from "react";
import {
  REJECT_REASON_LABELS,
  submitReport,
  type RejectReason,
} from "@/lib/moderation-store";

export function ReportButton({
  targetType,
  targetId,
  targetTitle,
  creatorHandle,
}: {
  targetType: "character" | "scene" | "world";
  targetId: string;
  targetTitle: string;
  creatorHandle: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<RejectReason>("other");
  const [body, setBody] = useState("");
  const [done, setDone] = useState<string | null>(null);

  if (done) {
    return <p className="mt-2 text-xs text-[var(--accent-2)]">{done}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)]"
      >
        รายงาน
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="text-sm font-medium">รายงานผลงาน</p>
      <label className="mt-2 block text-xs text-[var(--muted)]">เหตุผล</label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as RejectReason)}
        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm"
      >
        {(Object.keys(REJECT_REASON_LABELS) as RejectReason[]).map((k) => (
          <option key={k} value={k}>
            {REJECT_REASON_LABELS[k]}
          </option>
        ))}
      </select>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
        className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
          onClick={() => {
            submitReport({
              targetType,
              targetId,
              targetTitle,
              creatorHandle,
              body,
              reason,
            });
            setDone("ส่งรายงานแล้ว · เข้าคิวตรวจ");
            setOpen(false);
          }}
        >
          ส่งรายงาน
        </button>
        <button
          type="button"
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
          onClick={() => setOpen(false)}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
