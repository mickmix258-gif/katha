"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { tags } from "@/data/catalog";
import type { CatalogParams } from "@/lib/catalog-query";
import { parseCatalogParams } from "@/lib/catalog-query";

const sorts = [
  { id: "trending", label: "กำลังฮิต" },
  { id: "new", label: "ล่าสุด" },
  { id: "most_played", label: "เล่นมากสุด" },
  { id: "most_messages", label: "บทมากสุด" },
  { id: "most_likes", label: "ถูกใจมากสุด" },
] as const;

const windows = [
  { id: "all", label: "ทั้งหมด" },
  { id: "today", label: "วันนี้" },
  { id: "7d", label: "7 วัน" },
  { id: "30d", label: "30 วัน" },
] as const;

const sections = [
  { id: "all", label: "ทั้งหมด" },
  { id: "popular", label: "ยอดนิยม" },
  { id: "fresh", label: "มาใหม่" },
  { id: "newest", label: "ล่าสุด" },
  { id: "top", label: "ท็อป" },
  { id: "following", label: "ที่ติดตาม" },
  { id: "saved", label: "ที่เก็บไว้" },
  { id: "liked", label: "ที่ถูกใจ" },
] as const;

export function CatalogFilters({ showGender = false }: { showGender?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = parseCatalogParams(Object.fromEntries(searchParams.entries()));

  function push(next: Partial<CatalogParams> & { tags?: string[] }) {
    const merged: CatalogParams = { ...params, ...next };
    const sp = new URLSearchParams();
    if (merged.tags.length) sp.set("tags", merged.tags.join(","));
    if (merged.rating && merged.rating !== "any") sp.set("rating", merged.rating);
    if (merged.gender) sp.set("gender", merged.gender);
    if (merged.sort !== "trending") sp.set("sort", merged.sort);
    if (merged.window !== "all") sp.set("window", merged.window);
    if (merged.contentMode !== "all") sp.set("contentMode", merged.contentMode);
    if (merged.section !== "all") sp.set("section", merged.section);
    if (merged.q) sp.set("q", merged.q);
    const q = sp.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  function toggleTag(slug: string) {
    const tagsNext = params.tags.includes(slug)
      ? params.tags.filter((t) => t !== slug)
      : [...params.tags, slug];
    push({ tags: tagsNext });
  }

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => push({ section: s.id })}
            className={`rounded-full px-3 py-1 text-xs ${
              params.section === s.id ? "bg-[var(--accent)] text-black" : "border border-[var(--line)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[var(--muted)] self-center">เรียง</span>
        {sorts.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => push({ sort: s.id })}
            className={`rounded-full px-3 py-1 text-xs ${
              params.sort === s.id ? "bg-[var(--accent-2)] text-black" : "border border-[var(--line)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[var(--muted)] self-center">ช่วงเวลา</span>
        {windows.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => push({ window: w.id })}
            className={`rounded-full px-3 py-1 text-xs ${
              params.window === w.id ? "border border-[var(--accent)]" : "border border-[var(--line)]"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => push({ contentMode: "all", rating: "any" })}
          className={`rounded-full px-3 py-1 text-xs ${
            params.contentMode === "all" && params.rating === "any"
              ? "bg-[var(--accent)] text-black"
              : "border border-[var(--line)]"
          }`}
        >
          แสดงทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => push({ contentMode: "safe_only", rating: "any" })}
          className={`rounded-full px-3 py-1 text-xs ${
            params.contentMode === "safe_only" ? "bg-[var(--accent)] text-black" : "border border-[var(--line)]"
          }`}
        >
          ซ่อนผู้ใหญ่
        </button>
        <button
          type="button"
          onClick={() => push({ rating: "safe", contentMode: "all" })}
          className={`rounded-full px-3 py-1 text-xs ${
            params.rating === "safe" ? "border border-[var(--accent)]" : "border border-[var(--line)]"
          }`}
        >
          ทั่วไป
        </button>
        <button
          type="button"
          onClick={() => push({ rating: "mature", contentMode: "all" })}
          className={`rounded-full px-3 py-1 text-xs ${
            params.rating === "mature" ? "border border-[var(--accent)]" : "border border-[var(--line)]"
          }`}
        >
          ผู้ใหญ่
        </button>
      </div>

      {showGender ? (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-[var(--muted)] self-center">เพศนำเสนอ</span>
          {["female", "male", "nonbinary", "unspecified"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => push({ gender: params.gender === g ? undefined : g })}
              className={`rounded-full px-3 py-1 text-xs ${
                params.gender === g ? "border border-[var(--accent)]" : "border border-[var(--line)]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => toggleTag(t.slug)}
            className={`rounded-full px-3 py-1 text-xs ${
              params.tags.includes(t.slug) ? "bg-[var(--accent)] text-black" : "border border-[var(--line)]"
            }`}
          >
            {t.labelTh}
          </button>
        ))}
      </div>
    </div>
  );
}
