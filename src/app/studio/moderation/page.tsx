"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listAllJobs,
  REJECT_REASON_LABELS,
  resolveModerationJob,
  type ModerationJob,
  type ModVerdict,
  type RejectReason,
} from "@/lib/moderation-store";
import th from "@/locales/th.json";

function verdictTh(v: ModerationJob["verdict"] | ModVerdict) {
  if (v === "approve") return th.moderation.approved;
  if (v === "decline") return th.moderation.declined;
  if (v === "needs_review") return th.moderation.needsReview;
  return th.moderation.pending;
}

export default function StudioModerationPage() {
  const [jobs, setJobs] = useState<ModerationJob[]>([]);
  const [reason, setReason] = useState<RejectReason>("other");

  const refresh = () => setJobs(listAllJobs());

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-moderation", on);
    window.addEventListener("katha-works", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-moderation", on);
      window.removeEventListener("katha-works", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const open = jobs.filter((j) => j.status === "open");
  const closed = jobs.filter((j) => j.status === "closed");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/studio" className="text-sm text-[var(--accent-2)]">
        ← สตูดิโอ
      </Link>
      <p className="mt-4 text-xs tracking-[0.3em] text-[var(--accent-2)]">M6 · MODERATION</p>
      <h1 className="mt-2 text-3xl">คิวตรวจ</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        AI pre-mod stub + คิวแอดมิน · ซ่อนคำสั่งระบบจากสาธารณะยังบังคับอยู่
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[var(--muted)]">เหตุผลปฏิเสธเริ่มต้น:</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as RejectReason)}
          className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-3 py-1"
        >
          {(Object.keys(REJECT_REASON_LABELS) as RejectReason[]).map((k) => (
            <option key={k} value={k}>
              {REJECT_REASON_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <section className="mt-8">
        <h2 className="text-xl">เปิดอยู่ ({open.length})</h2>
        {open.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">ไม่มีงานในคิว</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {open.map((job) => (
              <li key={job.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
                <JobCard job={job} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
                    onClick={() => {
                      resolveModerationJob(job.id, "approve");
                      refresh();
                    }}
                  >
                    อนุมัติ
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                    onClick={() => {
                      resolveModerationJob(job.id, "decline", reason);
                      refresh();
                    }}
                  >
                    ปฏิเสธ
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                    onClick={() => {
                      resolveModerationJob(job.id, "needs_review", "other");
                      refresh();
                    }}
                  >
                    ต้องตรวจต่อ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl">ปิดแล้ว ({closed.length})</h2>
        <ul className="mt-3 space-y-2">
          {closed.slice(0, 40).map((job) => (
            <li key={job.id} className="rounded-xl border border-[var(--line)] px-4 py-3 opacity-80">
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function JobCard({ job }: { job: ModerationJob }) {
  return (
    <div>
      <p className="text-xs text-[var(--accent-2)]">
        {job.targetType} · @{job.creatorHandle} · AI: {verdictTh(job.aiVerdict)}
        {job.aiReason ? ` (${job.aiReason})` : ""}
      </p>
      <p className="mt-1 font-medium">{job.targetTitle}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        สถานะ: {job.status === "open" ? "เปิด" : "ปิด"} · คำตัดสิน: {verdictTh(job.verdict)}
        {job.reason ? ` · ${String(job.reason)}` : ""}
      </p>
      {job.reportBody ? (
        <p className="mt-2 text-sm text-[var(--muted)]">รายงาน: {job.reportBody}</p>
      ) : null}
    </div>
  );
}
