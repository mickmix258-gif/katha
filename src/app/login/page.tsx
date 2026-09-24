"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthStatus = {
  configured: boolean;
  providers: { google: boolean; twitter: boolean };
};

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authInfo, setAuthInfo] = useState<AuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"google" | "twitter" | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/wallet");
    }
  }, [status, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/status");
        const json = (await res.json()) as { auth?: AuthStatus };
        if (!cancelled && json.auth) setAuthInfo(json.auth);
        else if (!cancelled) {
          setAuthInfo({ configured: false, providers: { google: false, twitter: false } });
        }
      } catch {
        if (!cancelled) {
          setAuthInfo({ configured: false, providers: { google: false, twitter: false } });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onProvider = async (provider: "google" | "twitter") => {
    setError(null);
    setBusy(provider);
    try {
      await signIn(provider, { callbackUrl: "/wallet" });
    } catch {
      setError("เข้าสู่ระบบไม่สำเร็จ — ลองใหม่หรือติดต่อผู้ดูแล");
      setBusy(null);
    }
  };

  const configured = authInfo?.configured ?? false;
  const google = authInfo?.providers.google ?? false;
  const twitter = authInfo?.providers.twitter ?? false;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">LOGIN</p>
      <h1 className="mt-2 text-3xl">เข้าสู่ระบบ</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        ใช้ Google หรือ X (Twitter) — พระจันทร์ถูกเก็บและหักบนเซิร์ฟเวอร์เมื่อเข้าสู่ระบบแล้ว
      </p>

      {status === "authenticated" && session?.user ? (
        <p className="mt-6 text-sm text-[var(--accent-2)]">
          เข้าสู่ระบบแล้วในชื่อ {session.user.name || session.user.email} — กำลังพาไปกระเป๋า…
        </p>
      ) : null}

      {!authInfo ? (
        <p className="mt-8 text-sm text-[var(--muted)]">กำลังตรวจการตั้งค่า…</p>
      ) : !configured ? (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 text-sm">
          <p className="font-medium text-amber-200">OAuth ยังไม่ได้ตั้งค่า</p>
          <p className="mt-2 text-[var(--muted)]">
            ผู้ดูแลระบบต้องตั้งค่าตัวแปรบน Vercel:{" "}
            <code className="text-xs">AUTH_SECRET</code>,{" "}
            <code className="text-xs">AUTH_GOOGLE_ID</code> /{" "}
            <code className="text-xs">AUTH_GOOGLE_SECRET</code> และ/หรือ{" "}
            <code className="text-xs">AUTH_TWITTER_ID</code> /{" "}
            <code className="text-xs">AUTH_TWITTER_SECRET</code>
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            ดูรายละเอียดใน docs/M7_PRESHARE_SECURITY.md — สร้าง AUTH_SECRET ด้วย{" "}
            <code>openssl rand -base64 32</code>
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {google ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void onProvider("google")}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm text-white disabled:opacity-50"
            >
              {busy === "google" ? "กำลังเปิด Google…" : "เข้าด้วย Google"}
            </button>
          ) : null}
          {twitter ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void onProvider("twitter")}
              className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm disabled:opacity-50"
            >
              {busy === "twitter" ? "กำลังเปิด X…" : "เข้าด้วย X (Twitter)"}
            </button>
          ) : null}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <p className="mt-10 text-center text-xs text-[var(--muted)]">
        <Link href="/" className="text-[var(--accent-2)]">
          กลับหน้าแรก
        </Link>
      </p>
    </div>
  );
}
