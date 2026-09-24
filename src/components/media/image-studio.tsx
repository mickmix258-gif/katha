"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  failMessageTh,
  generateImage,
  listImagesForThread,
} from "@/lib/media/image-store";
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
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
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

  const onGenerate = async () => {
    setError(null);
    setSuccessNote(null);
    setBusy(true);
    try {
      const result = await generateImage({
        prompt,
        styleId,
        rating: "safe",
        threadId,
        entityTitle,
      });
      if (!result.ok) {
        setError(failMessageTh(result));
        return;
      }
      setBalance(result.balance);
      setPreview(result.image.dataUrl);
      setSuccessNote(
        result.image.fromModel
          ? `จากบริการสร้างภาพ${result.image.model ? ` · ${result.image.model}` : ""} · −${IMAGE_COST}`
          : `สร้างภาพแล้ว · −${IMAGE_COST}`,
      );
      onGenerated?.(result.image.id);
      refresh();
    } catch {
      setError("สร้างภาพไม่สำเร็จ — ลองใหม่ภายหลัง");
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
        <h2 className={compact ? "text-sm font-medium" : "text-xl"}>สร้างภาพ</h2>
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
      <p className="mt-3 text-xs text-[var(--muted)]">
        นโยบายภาพ: SFW เท่านั้น · เซ็กซี่ระดับชุดว่ายน้ำ/บิกินีได้ · ห้ามเปลือยหรือโป๊
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onGenerate()}
        className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "กำลังสร้าง…" : `สร้างภาพ (−${IMAGE_COST})`}
      </button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {successNote ? (
        <p className="mt-2 text-xs text-[var(--accent-2)]">{successNote}</p>
      ) : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="ภาพล่าสุดจากโมเดล"
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
          สร้างจากบริการสร้างภาพฟรีผ่านเซิร์ฟเวอร์ · SFW ล็อก · หักพระจันทร์เมื่อสำเร็จเท่านั้น · ดูทั้งหมดที่{" "}
          <Link href="/gallery" className="text-[var(--accent-2)]">
            แกลเลอรี
          </Link>
        </p>
      ) : null}
    </div>
  );
}
