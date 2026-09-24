"use client";

import Link from "next/link";
import { ImageStudio } from "@/components/media/image-studio";

export default function StudioImagesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/studio" className="text-sm text-[var(--accent-2)]">
        ← สตูดิโอ
      </Link>
      <p className="mt-4 text-xs tracking-[0.3em] text-[var(--accent-2)]">M5 · IMAGE STUDIO</p>
      <h1 className="mt-2 text-3xl">สตูดิโอภาพ</h1>
      <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
        สร้างภาพจากบริการสร้างภาพ (ฟรี) · พรอมต์ + สไตล์ · หักพระจันทร์เมื่อสำเร็จ · ดูผลในแกลเลอรี
      </p>
      <ImageStudio />
      <p className="mt-6 text-sm">
        <Link href="/gallery" className="text-[var(--accent-2)]">
          เปิดแกลเลอรี →
        </Link>
      </p>
    </div>
  );
}
