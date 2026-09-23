"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  createGroupRoom,
  getGroupRoomByInvite,
  joinGroupRoom,
  listGroupRooms,
  type GroupEntityKind,
  type GroupRoom,
} from "@/lib/play/group-room-store";
import { resolveGroupEntity } from "@/lib/play/resolve-entity";
import { characters as seedChars, scenes as seedScenes } from "@/data/catalog";
import { publishedCharacters, publishedScenes } from "@/lib/user-works-store";

function Inner() {
  const router = useRouter();
  const search = useSearchParams();
  const presetKind = (search.get("kind") as GroupEntityKind | null) ?? "character";
  const presetId = search.get("id") ?? "";

  const [rooms, setRooms] = useState<GroupRoom[]>([]);
  const [kind, setKind] = useState<GroupEntityKind>(presetKind);
  const [entityId, setEntityId] = useState(presetId);
  const [maxSeats, setMaxSeats] = useState(4);
  const [invite, setInvite] = useState("");
  const [guestName, setGuestName] = useState("ผู้เล่นใหม่");
  const [msg, setMsg] = useState<string | null>(null);

  const options = useMemo(() => {
    if (kind === "character") {
      const user = publishedCharacters().map((c) => ({ id: c.id, title: c.name }));
      const seed = seedChars.map((c) => ({ id: c.id, title: c.name }));
      return [...user, ...seed];
    }
    const user = publishedScenes().map((c) => ({ id: c.id, title: c.title }));
    const seed = seedScenes.map((c) => ({ id: c.id, title: c.title }));
    return [...user, ...seed];
  }, [kind]);

  useEffect(() => {
    const sync = () => setRooms(listGroupRooms());
    sync();
    window.addEventListener("katha-group-rooms", sync);
    return () => window.removeEventListener("katha-group-rooms", sync);
  }, []);

  useEffect(() => {
    if (presetId) setEntityId(presetId);
    if (presetKind) setKind(presetKind);
  }, [presetId, presetKind]);

  useEffect(() => {
    if (!entityId && options[0]) setEntityId(options[0].id);
  }, [options, entityId]);

  const create = () => {
    setMsg(null);
    const entity = resolveGroupEntity(kind, entityId);
    if (!entity) {
      setMsg("ไม่พบตัวละคร/ฉาก");
      return;
    }
    const openingContent =
      entity.openingNarration || entity.greeting || `ห้องกลุ่มกับ ${entity.title}`;
    const { room } = createGroupRoom({
      entityKind: kind,
      entityId: entity.id,
      entityTitle: entity.title,
      maxSeats,
      opening: {
        role: entity.openingNarration ? "narrator" : "assistant",
        content: openingContent,
      },
    });
    router.push(`/room/${room.threadId}`);
  };

  const joinByCode = () => {
    setMsg(null);
    const room = getGroupRoomByInvite(invite);
    if (!room) {
      setMsg("ไม่พบโค้ดเชิญ");
      return;
    }
    const res = joinGroupRoom(room.id, guestName);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    router.push(`/room/${room.threadId}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M6 · GROUP</p>
      <h1 className="mt-2 text-3xl">ห้องกลุ่ม</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        2–4 ที่นั่งมนุษย์ + ตัวละครหรือฉากหนึ่ง · เก็บในเครื่อง (localStorage)
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <h2 className="text-lg">สร้างห้องใหม่</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setKind("character")}
            className={`rounded-full px-4 py-2 text-sm ${
              kind === "character" ? "bg-[var(--accent)] text-white" : "border border-[var(--line)]"
            }`}
          >
            ตัวละคร
          </button>
          <button
            type="button"
            onClick={() => setKind("scene")}
            className={`rounded-full px-4 py-2 text-sm ${
              kind === "scene" ? "bg-[var(--accent)] text-white" : "border border-[var(--line)]"
            }`}
          >
            ฉากเรื่อง
          </button>
        </div>
        <label className="mt-4 block text-xs text-[var(--muted)]">เลือกผลงาน</label>
        <select
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
        <label className="mt-3 block text-xs text-[var(--muted)]">จำนวนที่นั่ง (2–4)</label>
        <select
          value={maxSeats}
          onChange={(e) => setMaxSeats(Number(e.target.value))}
          className="mt-1 rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm"
        >
          {[2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={create}
          className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white"
        >
          สร้างห้องกลุ่ม
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <h2 className="text-lg">เข้าร่วมด้วยโค้ด</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={invite}
            onChange={(e) => setInvite(e.target.value.toUpperCase())}
            placeholder="โค้ดเชิญ"
            className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-4 py-2 text-sm uppercase"
          />
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="ชื่อที่นั่ง"
            className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={joinByCode}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
          >
            เข้าร่วม
          </button>
        </div>
      </section>

      {msg ? <p className="mt-3 text-sm text-[var(--accent-2)]">{msg}</p> : null}

      <section className="mt-8">
        <h2 className="text-lg">ห้องล่าสุดในเครื่อง</h2>
        {rooms.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">ยังไม่มีห้องกลุ่ม</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rooms.map((r) => (
              <li key={r.id} className="rounded-xl border border-[var(--line)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.entityTitle}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {r.entityKind === "character" ? "ตัวละคร" : "ฉาก"} · {r.members.length}/
                      {r.maxSeats} · โค้ด {r.inviteCode}
                    </p>
                  </div>
                  <Link
                    href={`/room/${r.threadId}`}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
                  >
                    เข้าห้อง
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function PlayGroupPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-[var(--muted)]">กำลังโหลดล็อบบี้…</div>}>
      <Inner />
    </Suspense>
  );
}
