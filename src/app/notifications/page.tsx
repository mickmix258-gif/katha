"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notification-store";
import th from "@/locales/th.json";

const TYPE_LABEL: Record<AppNotification["type"], string> = {
  follow: "ติดตาม",
  like: "ถูกใจ",
  tip: "ทิป",
  moderation: "ตรวจ",
  creator_share: "ส่วนแบ่ง",
  report: "รายงาน",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);

  const refresh = () => setItems(listNotifications());

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-notifications", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-notifications", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M6 · NOTIFY</p>
          <h1 className="mt-2 text-3xl">{th.nav.notifications}</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            markAllNotificationsRead();
            refresh();
          }}
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
        >
          อ่านทั้งหมด
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">{th.empty.notifications}</p>
      ) : (
        <ul className="mt-8 space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border px-4 py-3 ${
                n.readAt
                  ? "border-[var(--line)] bg-[var(--paper)] opacity-70"
                  : "border-[var(--accent)]/50 bg-[var(--paper)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-[var(--accent-2)]">
                    {TYPE_LABEL[n.type]}
                  </p>
                  <p className="mt-1 font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{n.body}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {new Date(n.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!n.readAt ? (
                    <button
                      type="button"
                      className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                      onClick={() => {
                        markNotificationRead(n.id);
                        refresh();
                      }}
                    >
                      อ่านแล้ว
                    </button>
                  ) : null}
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => markNotificationRead(n.id)}
                      className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs text-white"
                    >
                      เปิด
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
