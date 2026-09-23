"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-[var(--accent-2)]">{label}</span>
      {hint ? <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} min-h-[96px] resize-y ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TagPicker({
  options,
  value,
  onChange,
}: {
  options: { slug: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt.slug);
        return (
          <button
            key={opt.slug}
            type="button"
            onClick={() =>
              onChange(on ? value.filter((t) => t !== opt.slug) : [...value, opt.slug])
            }
            className={`rounded-full border px-3 py-1 text-sm ${
              on
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusBanner({
  status,
  visibility,
}: {
  status: string;
  visibility?: string;
}) {
  const label =
    status === "draft"
      ? "ฉบับร่าง"
      : status === "pending_moderation"
        ? "เผยแพร่แล้ว · รอตรวจ (stub)"
        : status === "declined"
          ? "ไม่ผ่านการตรวจ"
          : "เผยแพร่แล้ว";
  return (
    <p className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm text-[var(--muted)]">
      สถานะ: <span className="text-[var(--accent-2)]">{label}</span>
      {visibility ? ` · การมองเห็น: ${visibility}` : null}
    </p>
  );
}

export function AgeGateNote() {
  return (
    <p className="rounded-xl border border-[var(--accent)]/40 bg-[rgba(180,35,24,0.12)] px-3 py-2 text-sm">
      ตัวละครทุกตัวต้องอายุ 18 ปีขึ้นไป — แพลตฟอร์มนี้ไม่มีช่องสำหรับตัวละครอายุต่ำกว่าเกณฑ์
    </p>
  );
}

export function EditorShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">CREATE</p>
      <h1 className="mt-2 text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-[var(--muted)]">{subtitle}</p> : null}
      <div className="mt-8 grid gap-5">{children}</div>
    </div>
  );
}

export function ActionRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3 pt-2">{children}</div>;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-white disabled:opacity-40 ${props.className ?? ""}`}
    />
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border border-[var(--line)] px-5 py-2.5 text-sm text-[var(--text)] disabled:opacity-40 ${props.className ?? ""}`}
    />
  );
}
