import Link from "next/link";
import th from "@/locales/th.json";

const links = [
  { href: "/", label: th.nav.home },
  { href: "/characters", label: th.nav.characters },
  { href: "/scenes", label: th.nav.scenes },
  { href: "/worlds", label: th.nav.worlds },
  { href: "/gallery", label: th.nav.gallery },
  { href: "/me/threads", label: th.nav.threads },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(16,12,10,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg tracking-[0.22em]">KATHA</span>
          <span className="hidden text-xs text-[var(--muted)] sm:inline">กถา</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-[var(--muted)] md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[var(--text)]">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/create"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
        >
          {th.nav.create}
        </Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] px-4 py-8 text-center text-xs text-[var(--muted)]">
      KATHA · ห้องสมุดเรื่องลับ · ตัวละครทุกตัวอายุ 18 ปีขึ้นไป
    </footer>
  );
}

export function Coming({ title, note }: { title: string; note: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">MILESTONE</p>
      <h1 className="mt-3 text-3xl">{title}</h1>
      <p className="mt-4 text-[var(--muted)]">{note}</p>
    </section>
  );
}
