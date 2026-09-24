import { assertDevStudioPageAccess, isDevStudioKeyConfigured } from "@/lib/dev-studio-gate";
import { DevStudioDashboard } from "./dashboard";

export const metadata = {
  title: "สตูดิโอผู้พัฒนา · KATHA",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * /dev/studio — Developer studio (NOT public creator studio).
 * Gate: DEV_STUDIO_KEY via ?key= OR authenticated team session.
 * Unauthenticated without key cannot see events.
 * No link from public nav/footer.
 */
export default async function DevStudioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawKey = sp.key;
  const queryKey = typeof rawKey === "string" ? rawKey : Array.isArray(rawKey) ? rawKey[0] : null;

  const gate = await assertDevStudioPageAccess({ queryKey });

  if (!gate.ok && gate.reason === "not_configured") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">DEV · STUDIO</p>
        <h1 className="mt-2 text-3xl">สตูดิโอผู้พัฒนา</h1>
        <p className="mt-4 text-[var(--muted)]">{gate.messageTh}</p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          ตั้งค่า <code className="text-[var(--accent-2)]">DEV_STUDIO_KEY</code> บน Vercel
          หรือเปิด OAuth ทีม — ดู docs/M8_ENV_CHECKLIST.md และ docs/M8_PUBLIC_DEV_STUDIO.md
        </p>
        <p className="mt-6 text-xs text-[var(--muted)]">
          หน้านี้ไม่ใช่สตูดิโอครีเอเตอร์สาธารณะ (/studio) และไม่แสดงเหตุการณ์เมื่อยังไม่ตั้งค่า
        </p>
      </section>
    );
  }

  if (!gate.ok) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">DEV · STUDIO</p>
        <h1 className="mt-2 text-3xl">สตูดิโอผู้พัฒนา</h1>
        <p className="mt-4 text-[var(--muted)]">{gate.messageTh}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
          {isDevStudioKeyConfigured() ? (
            <li>
              เปิด URL พร้อมรหัส:{" "}
              <code className="text-[var(--accent-2)]">/dev/studio?key=YOUR_KEY</code>
            </li>
          ) : null}
          <li>
            หรือ{" "}
            <a href="/login" className="underline hover:text-[var(--text)]">
              เข้าสู่ระบบทีม
            </a>{" "}
            แล้วกลับมาที่ /dev/studio
          </li>
        </ul>
        <p className="mt-6 text-xs text-[var(--muted)]">
          ไม่มีลิงก์จากเมนูสาธารณะ — เอกสารภายในเท่านั้น
        </p>
      </section>
    );
  }

  return (
    <DevStudioDashboard
      accessVia={gate.via}
      initialKey={gate.via === "key" ? queryKey ?? "" : ""}
    />
  );
}
