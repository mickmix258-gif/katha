"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import th from "@/locales/th.json";
import { readWorks, type UserWorksState } from "@/lib/user-works-store";

const hubs = [
  {
    href: "/create/quick-character",
    title: th.actions.quickCreate,
    note: "ชื่อ + พรอมต์ → ระบบเติมร่าง แล้วปรับได้",
  },
  {
    href: "/create/character",
    title: th.actions.fullCreate,
    note: "ฟอร์มเต็ม บทเปิด คำสั่งระบบ ผู้ร่วมสร้าง",
  },
  {
    href: "/create/world",
    title: th.actions.createWorld,
    note: "ชื่อ บทนำ โทน โลก ผู้อยู่อาศัย ใบโลก",
  },
  {
    href: "/create/scene",
    title: th.actions.createScene,
    note: "บทเปิดฉาก NPC ใบโลก เชื่อมโลก",
  },
];

export default function CreateHubPage() {
  const [works, setWorks] = useState<UserWorksState | null>(null);

  useEffect(() => {
    const sync = () => setWorks(readWorks());
    sync();
    window.addEventListener("katha-works", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("katha-works", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M3 · EDITORS</p>
      <h1 className="mt-2 text-3xl">สร้างผลงาน</h1>
      <p className="mt-2 text-[var(--muted)]">
        บันทึกฉบับร่างหรือเผยแพร่ไปแค็ตตาล็อก (localStorage) — ห้องบท LLM มาใน M4
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {hubs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 transition hover:border-[var(--accent)]"
          >
            <h2 className="text-xl">{item.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{item.note}</p>
          </Link>
        ))}
      </div>

      {works ? (
        <section className="mt-12">
          <h2 className="text-xl">ผลงานของคุณ</h2>
          <div className="mt-4 grid gap-2">
            {works.characters.map((c) => (
              <Link
                key={c.id}
                href={`/create/character?id=${c.id}`}
                className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
              >
                ตัวละคร · {c.name || "(ไม่มีชื่อ)"} · {c.status}
              </Link>
            ))}
            {works.scenes.map((s) => (
              <Link
                key={s.id}
                href={`/create/scene?id=${s.id}`}
                className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
              >
                ฉาก · {s.title || "(ไม่มีชื่อ)"} · {s.status}
              </Link>
            ))}
            {works.worlds.map((w) => (
              <Link
                key={w.id}
                href={`/create/world?id=${w.id}`}
                className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
              >
                โลก · {w.title || "(ไม่มีชื่อ)"} · {w.status}
              </Link>
            ))}
            {!works.characters.length && !works.scenes.length && !works.worlds.length ? (
              <p className="text-sm text-[var(--muted)]">ยังไม่มีร่าง — เริ่มจากสร้างเร็วได้เลย</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
