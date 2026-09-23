"use client";

import { useEffect, useState } from "react";
import {
  patchSettings,
  readSettings,
  type ContentModePref,
  type SettingsState,
} from "@/lib/settings-store";
import th from "@/locales/th.json";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState | null>(null);

  useEffect(() => {
    const sync = () => setSettings(readSettings());
    sync();
    window.addEventListener("katha-settings", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("katha-settings", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!settings) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังโหลด…</div>;
  }

  const set = (patch: Partial<SettingsState>) => setSettings(patchSettings(patch));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M6 · SETTINGS</p>
      <h1 className="mt-2 text-3xl">{th.nav.settings}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        โหมดเนื้อหาและยืนยันอายุ · เก็บในเครื่อง
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <h2 className="text-lg">ยืนยันอายุ 18+</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{th.legal.ageGate}</p>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.ageVerified}
            onChange={(e) => set({ ageVerified: e.target.checked })}
          />
          ฉันอายุ 18 ปีขึ้นไป และยอมรับการแสดงเนื้อหาผู้ใหญ่
        </label>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <h2 className="text-lg">โหมดเนื้อหา</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["all", th.filters.allContent],
              ["safe_only", th.filters.safeOnly],
            ] as [ContentModePref, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => set({ contentMode: value })}
              className={`rounded-full px-4 py-2 text-sm ${
                settings.contentMode === value
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          ค่าเริ่มต้นของตัวกรองสำรวจ · ใช้ร่วมกับพารามิเตอร์{" "}
          <code className="text-[var(--accent-2)]">contentMode</code> ใน URL
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <h2 className="text-lg">ตรวจอัตโนมัติ (stub)</h2>
        <label className="mt-3 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.autoModerate}
            onChange={(e) => set({ autoModerate: e.target.checked })}
          />
          ให้ AI stub อนุมัติ/ปฏิเสธอัตโนมัติเมื่อชัดเจน
        </label>
      </section>
    </div>
  );
}
