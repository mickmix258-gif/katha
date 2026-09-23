"use client";

import { useEffect, useState } from "react";
import {
  advanceTurn,
  allMembersInnerOptIn,
  getGroupRoom,
  joinGroupRoom,
  leaveGroupRoom,
  setMaxSeats,
  setMemberInnerOptIn,
  type GroupRoom,
} from "@/lib/play/group-room-store";
import { getThread, saveThread } from "@/lib/play/thread-store";

export function GroupSeatsPanel({
  roomId,
  onChange,
}: {
  roomId: string;
  onChange?: () => void;
}) {
  const [room, setRoom] = useState<GroupRoom | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    setRoom(getGroupRoom(roomId) ?? null);
    onChange?.();
  };

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-group-rooms", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-group-rooms", on);
      window.removeEventListener("storage", on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  if (!room) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
        ไม่พบห้องกลุ่ม
      </div>
    );
  }

  const turnMember = room.members.find((m) => m.userId === room.currentTurnUserId);
  const allOptIn = allMembersInnerOptIn(room);

  const syncInnerMono = (r: GroupRoom) => {
    const thread = getThread(r.threadId);
    if (!thread) return;
    const allow = allMembersInnerOptIn(r);
    if (thread.settings.innerMonologue !== allow) {
      saveThread({
        ...thread,
        settings: { ...thread.settings, innerMonologue: allow },
      });
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="text-xs tracking-[0.2em] text-[var(--accent-2)]">GROUP · {room.members.length}/{room.maxSeats}</p>
      <h2 className="mt-1 text-sm font-medium">ที่นั่งในห้อง</h2>
      <p className="mt-1 text-[10px] text-[var(--muted)]">
        โค้ดเชิญ: <span className="text-[var(--accent-2)]">{room.inviteCode}</span>
      </p>
      <p className="mt-1 text-[10px] text-[var(--muted)]">
        เทิร์นปัจจุบัน: {turnMember?.displayName ?? "—"} (stub)
      </p>

      <ul className="mt-3 space-y-2">
        {room.members.map((m) => (
          <li
            key={m.userId}
            className={`rounded-xl border px-3 py-2 text-xs ${
              m.userId === room.currentTurnUserId
                ? "border-[var(--accent)] bg-[rgba(180,35,24,0.12)]"
                : "border-[var(--line)]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span>
                ที่นั่ง {m.seat + 1} · {m.displayName}{" "}
                {m.role === "host" ? "(โฮสต์)" : ""}
              </span>
              {m.role !== "host" ? (
                <button
                  type="button"
                  className="text-[var(--muted)] underline"
                  onClick={() => {
                    const res = leaveGroupRoom(room.id, m.userId);
                    setMsg(res.ok ? "ออกจากห้องแล้ว" : res.error);
                    refresh();
                  }}
                >
                  ออก
                </button>
              ) : null}
            </div>
            <label className="mt-1 flex items-center gap-2 text-[10px] text-[var(--muted)]">
              <input
                type="checkbox"
                checked={m.innerMonologueOptIn}
                onChange={(e) => {
                  const next = setMemberInnerOptIn(room.id, m.userId, e.target.checked);
                  if (next) syncInnerMono(next);
                  refresh();
                }}
              />
              ยินยอมบทในใจ (ต้องครบทุกคน)
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="rounded-full border border-[var(--line)] bg-[var(--ink)] px-3 py-1 text-xs"
          value={room.maxSeats}
          onChange={(e) => {
            setMaxSeats(room.id, Number(e.target.value));
            refresh();
          }}
        >
          {[2, 3, 4].map((n) => (
            <option key={n} value={n}>
              ที่นั่งสูงสุด {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
          onClick={() => {
            advanceTurn(room.id);
            refresh();
          }}
        >
          ส่งเทิร์นต่อ
        </button>
      </div>

      {room.members.length < room.maxSeats ? (
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อที่นั่งจำลอง"
            className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--ink)] px-3 py-1 text-xs"
          />
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs text-white"
            onClick={() => {
              const res = joinGroupRoom(room.id, name);
              setMsg(res.ok ? `เข้าร่วมแล้ว · ${res.room.members.length} คน` : res.error);
              if (res.ok) setName("");
              refresh();
            }}
          >
            เข้าร่วม
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-[var(--muted)]">ที่นั่งเต็ม</p>
      )}

      <p className="mt-2 text-[10px] text-[var(--muted)]">
        บทในใจกลุ่ม: {allOptIn ? "เปิดได้ (ทุกคนยินยอม)" : "ปิด — ต้องยินยอมครบ"}
      </p>
      {msg ? <p className="mt-1 text-[10px] text-[var(--accent-2)]">{msg}</p> : null}
    </div>
  );
}
