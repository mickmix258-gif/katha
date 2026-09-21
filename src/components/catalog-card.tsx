import Link from "next/link";
import { tagLabel } from "@/data/catalog";

type CardProps = {
  href: string;
  title: string;
  subtitle: string;
  tags: string[];
  rating: "safe" | "mature";
  meta: string;
};

export function CatalogCard({ href, title, subtitle, tags, rating, meta }: CardProps) {
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      <div className="mb-4 flex h-36 items-end rounded-xl bg-gradient-to-br from-[#3a221c] to-[#120e0c] p-3 text-xs text-[var(--accent-2)]">
        {rating === "mature" ? "ผู้ใหญ่" : "ทั่วไป"}
      </div>
      <h3 className="text-lg leading-snug">{title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{subtitle}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--muted)]">
            {tagLabel(tag)}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">{meta}</p>
    </Link>
  );
}
