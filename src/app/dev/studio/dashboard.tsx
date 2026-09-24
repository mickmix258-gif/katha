"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoredTelemetryEvent } from "@/lib/telemetry-types";

type Props = {
  accessVia: "key" | "session";
  /** When access was via ?key=, pass through to API header (avoid leaving key only in URL bar permanently). */
  initialKey: string;
};

type ApiOk = {
  ok: true;
  backend: string;
  ringLimit: number;
  total: number;
  counts: Record<string, number>;
  events: StoredTelemetryEvent[];
  via: string;
};

export function DevStudioDashboard({ accessVia, initialKey }: Props) {
  const [data, setData] = useState<ApiOk | null>(null);
  const [errorTh, setErrorTh] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorTh(null);
    try {
      const headers: Record<string, string> = {};
      if (initialKey) headers["x-dev-studio-key"] = initialKey;
      const res = await fetch("/api/telemetry/events?limit=100", {
        headers,
        credentials: "same-origin",
      });
      const json = (await res.json()) as ApiOk | { ok: false; messageTh?: string };
      if (!res.ok || !json.ok) {
        setData(null);
        setErrorTh(
          "messageTh" in json && json.messageTh
            ? json.messageTh
            : "โหลดเหตุการณ์ไม่สำเร็จ",
        );
        return;
      }
      setData(json);
    } catch {
      setErrorTh("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [initialKey]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  const counts = data?.counts ?? {};
  const countEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">DEV · STUDIO</p>
      <h1 className="mt-2 text-3xl">สตูดิโอผู้พัฒนา</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        แดชบอร์ดเหตุการณ์จากเว็บสาธารณะ · ไม่ใช่สตูดิโอครีเอเตอร์ (/studio) · เข้าผ่าน{" "}
        {accessVia === "key" ? "รหัส DEV_STUDIO_KEY" : "เซสชันทีม"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-white"
        >
          รีเฟรช
        </button>
        {data ? (
          <span className="text-[var(--muted)]">
            เก็บ: {data.backend} · รวมในบัฟเฟอร์ ~{data.total}/{data.ringLimit} · อัปเดตอัตโนมัติทุก
            15 วินาที
          </span>
        ) : null}
      </div>

      {loading && !data ? (
        <p className="mt-8 text-[var(--muted)]">กำลังโหลด…</p>
      ) : null}
      {errorTh ? <p className="mt-6 text-[var(--accent)]">{errorTh}</p> : null}

      {data ? (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {countEntries.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">ยังไม่มีเหตุการณ์</p>
            ) : (
              countEntries.map(([type, n]) => (
                <div
                  key={type}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3"
                >
                  <p className="text-xs text-[var(--muted)]">{type}</p>
                  <p className="mt-1 text-2xl tabular-nums">{n}</p>
                </div>
              ))
            )}
          </div>

          <h2 className="mt-10 text-lg">เหตุการณ์ล่าสุด</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            เก็บเฉพาะเส้นทาง / เซสชันหยาบ / อุปกรณ์-OS-เบราว์เซอร์หยาบ / รหัสเหตุผล — ไม่มี IP ดิบ,
            UA เต็ม, พรอมต์ หรือคีย์
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--paper-2)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">เวลา</th>
                  <th className="px-3 py-2 font-medium">ประเภท</th>
                  <th className="px-3 py-2 font-medium">เส้นทาง</th>
                  <th className="px-3 py-2 font-medium">ลูกค้า</th>
                  <th className="px-3 py-2 font-medium">เซสชัน</th>
                  <th className="px-3 py-2 font-medium">เมตา</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={e.id} className="border-t border-[var(--line)]">
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-xs text-[var(--muted)]">
                      {e.ts.replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="px-3 py-2">{e.type}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.path ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-[var(--muted)]">
                      {[e.client?.device, e.client?.os, e.client?.browser]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">
                      {e.sessionId ?? "—"}
                    </td>
                    <td className="max-w-[14rem] truncate px-3 py-2 font-mono text-xs text-[var(--muted)]">
                      {e.meta ? JSON.stringify(e.meta) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
