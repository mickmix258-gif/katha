"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import th from "@/locales/th.json";
import { listGallery, type GalleryImage } from "@/lib/media/image-store";
import { STYLE_PRESETS } from "@/lib/media/mock-image";

type RatingFilter = "all" | "safe" | "mature";
type SourceFilter = "all" | "generated" | "seed";

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [rating, setRating] = useState<RatingFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");

  const refresh = () => setImages(listGallery({ rating }));

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-images", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-images", on);
      window.removeEventListener("storage", on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating]);

  const filtered = useMemo(() => {
    if (source === "all") return images;
    return images.filter((i) => i.source === source);
  }, [images, source]);

  const styleLabel = (id: string) =>
    STYLE_PRESETS.find((s) => s.id === id)?.labelTh ?? id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-[var(--accent-2)]">M5 · GALLERY</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">{th.nav.gallery}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            ภาพม็อกที่สร้าง + ภาพซีดจากตัวละคร · กรองทั่วไป / ผู้ใหญ่
          </p>
        </div>
        <Link
          href="/studio/images"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
        >
          สร้างภาพ
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", th.filters.all],
            ["safe", th.filters.safe],
            ["mature", th.filters.mature],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRating(id)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              rating === id
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 self-center text-[var(--line)]">|</span>
        {(
          [
            ["all", "ทุกแหล่ง"],
            ["generated", "ที่สร้าง"],
            ["seed", "ซีด"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSource(id)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              source === id
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <p className="mt-10 text-[var(--muted)]">
          ยังไม่มีภาพในตัวกรองนี้ —{" "}
          <Link href="/studio/images" className="text-[var(--accent-2)]">
            สร้างภาพม็อก
          </Link>
        </p>
      ) : (
        <div className="card-grid mt-8">
          {filtered.map((img) => (
            <article
              key={img.id}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.prompt}
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="p-3">
                <p className="line-clamp-2 text-sm">{img.prompt}</p>
                <p className="mt-2 text-[10px] text-[var(--muted)]">
                  {styleLabel(img.styleId)} · {img.rating === "mature" ? "ผู้ใหญ่" : "ทั่วไป"} ·{" "}
                  {img.source === "generated" ? "สร้างเอง" : "ซีด"}
                  {img.costMoons ? ` · −${img.costMoons}` : ""}
                  {img.entityTitle ? ` · ${img.entityTitle}` : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
