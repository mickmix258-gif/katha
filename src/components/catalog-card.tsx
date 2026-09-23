import Link from "next/link";
import { tagLabel } from "@/data/catalog";
import { renderCoverPortrait } from "@/lib/media/mock-image";

type CardProps = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  tags: string[];
  rating: "safe" | "mature";
  meta: string;
};

export function CatalogCard({ id, href, title, subtitle, tags, rating, meta }: CardProps) {
  const cover = renderCoverPortrait({
    id,
    title,
    subtitle,
    rating,
    tags,
  });

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt={title}
        className="mb-4 h-36 w-full rounded-xl object-cover"
      />
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
