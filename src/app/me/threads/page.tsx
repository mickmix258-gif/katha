"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteThread, listAllThreads } from "@/lib/play/thread-store";
import type { PlayThread } from "@/lib/play/types";

export default function ThreadsPage() {
  const [threads, setThreads] = useState<PlayThread[]>([]);

  const refresh = () => setThreads(listAllThreads());

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-threads", on);
    return () => window.removeEventListener("katha-threads", on);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl">บทของฉัน</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        เธรดเก็บในเครื่อง (localStorage) · ยังไม่มีซิงค์คลาวด์
      </p>
      {!threads.length ? (
        <p className="mt-8 text-[var(--muted)]">ยังไม่มีบท — เริ่มจากตัวละคร ฉาก หรือโลก</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {threads.map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
            >
              <div>
                <Link href={`/play/thread/${t.id}`} className="text-lg hover:text-[var(--accent-2)]">
                  {t.entityTitle}
                </Link>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {modeTh(t.mode)} · เทิร์น {t.turnCount} · {new Date(t.updatedAt).toLocaleString("th-TH")}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-[var(--muted)]"
                onClick={() => {
                  deleteThread(t.id);
                  refresh();
                }}
              >
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/characters" className="rounded-full border border-[var(--line)] px-4 py-2">
          ตลาดตัวละคร
        </Link>
        <Link href="/scenes" className="rounded-full border border-[var(--line)] px-4 py-2">
          ตลาดฉาก
        </Link>
        <Link href="/worlds" className="rounded-full border border-[var(--line)] px-4 py-2">
          ตลาดโลก
        </Link>
      </div>
    </div>
  );
}

function modeTh(mode: string) {
  if (mode === "character") return "ตัวละคร";
  if (mode === "scene") return "ฉาก";
  if (mode === "world") return "โลก";
  if (mode === "multi_npc") return "หลายตัว";
  return mode;
}
