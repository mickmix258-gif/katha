"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthNav() {
  const { data, status } = useSession();

  if (status === "loading") {
    return (
      <span className="hidden text-xs text-[var(--muted)] sm:inline">…</span>
    );
  }

  if (data?.user) {
    const label = data.user.name || data.user.email || "บัญชี";
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[8rem] truncate text-xs text-[var(--muted)] sm:inline" title={label}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
        >
          ออก
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
    >
      เข้าสู่ระบบ
    </Link>
  );
}
