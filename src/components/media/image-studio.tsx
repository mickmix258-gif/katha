"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateMockImage, listImagesForThread } from "@/lib/media/image-store";
import { STYLE_PRESETS, type StylePresetId } from "@/lib/media/mock-image";
import { IMAGE_COST, readWallet } from "@/lib/wallet-store";

type Props = {
  threadId?: string;
  entityTitle?: string;
  compact?: boolean;
  onGenerated?: (imageId: string) => void;
};

export function ImageStudio({ threadId, entityTitle, compact, onGenerated }: Props) {
  const [prompt, setPrompt] = useState(entityTitle ? `ภาพของ ${entityTitle}` : "");
  const [styleId, setStyleId] = useState<StylePresetId>("ink");
  const [rating, setRating] = useState<"safe" | "mature">("safe");
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [threadThumbs, setThreadThumbs] = useState<
    { id: string; dataUrl: string; prompt: string }[]
  >([]);

  const refresh = () => {
    setBalance(readWallet().balance);
    if (threadId) {
      setThreadThumbs(
        listImagesForThread(threadId).map((i) => ({
          id: i.id,
          dataUrl: i.dataUrl,
          prompt: i.prompt,
        })),
      );
    }
  };

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("katha-wallet", on);
    window.addEventListener("katha-images", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("katha-wallet", on);
      window.removeEventListener("katha-images", on);
      window.removeEventListener("storage", on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const onGenerate = () => {
    setError(null);
    setBusy(true);
    try {
      const result = generateMockImage({
        prompt,
        styleId,
        rating,
        threadId,
        entityTitle,
      });
      if (!result.ok) {
        if (result.reason === "empty_prompt") {
          setError("ใส่พรอมต์ก่อนสร้างภาพ");
        } else {
          setError(
            `พระจันทร์ไม่พอ (มี ${result.balance} ต้องการ ${result.need ?? IMAGE_COST}) — รับโบนัสที่กระเป๋า`,
          );
        }
        return;
      }
      setBalance(result.balance);
      setPreview(result.image.dataUrl);
      onGenerated?.(result.image.id);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[var(--line)] bg-[var(--paper)] ${
        compact ? "p-3" : "p-5"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={compact ? "text-sm font-medium" : "text-xl"}>สร้างภาพม็อก</h2>
        <p className="text-xs text-[var(--muted)]">
          ราคา {IMAGE_COST} · ยอด {balance} ·{" "}
          <Link href="/wallet" className="text-[var(--accent-2)]">
            กระเป๋า
          </Link>
        </p>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder="อธิบายภาพที่ต้องการ…"
        className="mt-3 w-full rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {STYLE_PRESETS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStyleId(s.id)}
            className={`rounded-full px-3 py-1 text-xs ${
              styleId === s.id
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)]"
            }`}
          >
            {s.labelTh}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["safe", "ทั่วไป"],
            ["mature", "ผู้ใหญ่"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRating(id)}
            className={`rounded-full px-3 py-1 text-xs ${
              rating === id
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onGenerate}
        className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "กำลังสร้าง…" : `สร้างภาพ (−${IMAGE_COST})`}
      </button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="ภาพม็อกล่าสุด"
          className="mt-4 max-h-80 w-full rounded-xl border border-[var(--line)] object-contain"
        />
      ) : null}
      {threadThumbs.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs text-[var(--muted)]">ภาพในบทนี้</p>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {threadThumbs.map((t) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={t.id}
                src={t.dataUrl}
                alt={t.prompt}
                title={t.prompt}
                className="h-20 w-16 shrink-0 rounded-lg border border-[var(--line)] object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}
      {!compact ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          ภาพม็อกเป็น SVG ในเครื่อง — ไม่เรียก GPU จริง · ดูทั้งหมดที่{" "}
          <Link href="/gallery" className="text-[var(--accent-2)]">
            แกลเลอรี
          </Link>
        </p>
      ) : null}
    </div>
  );
}
