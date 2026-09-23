"use client";

import { characters } from "@/data/catalog";
import { newId } from "@/lib/user-works-store";
import { IMAGE_COST, readWallet, spendMoons } from "@/lib/wallet-store";
import { hashString, renderMockImage, type StylePresetId } from "./mock-image";

export type GalleryImage = {
  id: string;
  prompt: string;
  styleId: string;
  rating: "safe" | "mature";
  /** HTTPS URL from fal or SVG data URL (seed placeholders). */
  dataUrl: string;
  seed: number;
  source: "generated" | "seed";
  createdAt: string;
  threadId?: string;
  entityTitle?: string;
  costMoons: number;
  /** Present when generated via real fal model. */
  model?: string;
  fromModel?: boolean;
};

const KEY = "katha.images.v1";

export type ImageStoreState = { images: GalleryImage[] };

function empty(): ImageStoreState {
  return { images: [] };
}

export function readImages(): ImageStoreState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ImageStoreState;
    return { images: parsed.images ?? [] };
  } catch {
    return empty();
  }
}

export function writeImages(state: ImageStoreState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-images"));
}

export function listImages(): GalleryImage[] {
  return [...readImages().images].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listImagesForThread(threadId: string): GalleryImage[] {
  return listImages().filter((img) => img.threadId === threadId);
}

export function seedGalleryImages(): GalleryImage[] {
  return characters.slice(0, 6).map((c) => {
    const seed = hashString(`seed|${c.id}|${c.appearancePrompt}`);
    const rating = c.rating === "mature" ? "mature" : "safe";
    const styleId: StylePresetId =
      c.rating === "mature" ? "ember" : c.tags.includes("fantasy") ? "jade" : "ink";
    return {
      id: `seed-img-${c.id}`,
      prompt: c.appearancePrompt,
      styleId,
      rating,
      dataUrl: renderMockImage({
        prompt: `${c.name} — ${c.appearancePrompt}`,
        styleId,
        seed,
        rating,
      }),
      seed,
      source: "seed" as const,
      createdAt: c.publishedAt,
      entityTitle: c.name,
      costMoons: 0,
    };
  });
}

export function listGallery(opts?: { rating?: "all" | "safe" | "mature" }): GalleryImage[] {
  const generated = listImages();
  const seeds = seedGalleryImages().filter((s) => !generated.some((g) => g.id === s.id));
  let all = [...generated, ...seeds];
  if (opts?.rating === "safe") all = all.filter((i) => i.rating === "safe");
  if (opts?.rating === "mature") all = all.filter((i) => i.rating === "mature");
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type GenerateFailReason =
  | "insufficient"
  | "empty_prompt"
  | "no_provider"
  | "provider_error"
  | "provider_auth"
  | "provider_forbidden"
  | "bad_input"
  | "rate_limited"
  | "timeout"
  | "safe_mode"
  | "bad_request";

export type GenerateResult =
  | { ok: true; image: GalleryImage; balance: number }
  | {
      ok: false;
      reason: GenerateFailReason;
      balance: number;
      need?: number;
      messageTh?: string;
    };

type ApiOk = {
  ok: true;
  imageUrl?: string;
  dataUrl?: string;
  seed?: number;
  model?: string;
};

type ApiFail = {
  ok: false;
  reason?: GenerateFailReason;
  messageTh?: string;
};

/**
 * Real model generation via `/api/images/generate` (fal.ai).
 * Checks balance first; deducts IMAGE_COST moons only after a successful response.
 * Never falls back to SVG mock on missing key / provider failure.
 */
export async function generateImage(input: {
  prompt: string;
  styleId?: string;
  rating?: "safe" | "mature";
  threadId?: string;
  entityTitle?: string;
}): Promise<GenerateResult> {
  const prompt = input.prompt.trim();
  const balance = readWallet().balance;
  if (!prompt) return { ok: false, reason: "empty_prompt", balance };

  if (balance < IMAGE_COST) {
    return { ok: false, reason: "insufficient", balance, need: IMAGE_COST };
  }

  let api: ApiOk | ApiFail;
  try {
    const res = await fetch("/api/images/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        styleId: input.styleId ?? "ink",
        rating: input.rating ?? "safe",
      }),
    });
    api = (await res.json()) as ApiOk | ApiFail;
  } catch {
    return {
      ok: false,
      reason: "provider_error",
      balance: readWallet().balance,
      messageTh: "สร้างภาพไม่สำเร็จ — เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
    };
  }

  if (!api.ok) {
    return {
      ok: false,
      reason: api.reason ?? "provider_error",
      balance: readWallet().balance,
      messageTh: api.messageTh,
    };
  }

  const imageUrl = api.imageUrl || api.dataUrl;
  if (!imageUrl) {
    return {
      ok: false,
      reason: "provider_error",
      balance: readWallet().balance,
      messageTh: "สร้างภาพไม่สำเร็จ — ไม่ได้รับรูปจากโมเดล",
    };
  }

  // Charge only after successful generation.
  const spend = spendMoons(IMAGE_COST, "image_spend", "สร้างภาพ", {
    prompt: prompt.slice(0, 80),
    model: api.model ?? "",
  });
  if (!spend.ok) {
    return { ok: false, reason: "insufficient", balance: spend.balance, need: IMAGE_COST };
  }

  const styleId = input.styleId ?? "ink";
  const rating = input.rating ?? "safe";
  const seed =
    typeof api.seed === "number"
      ? api.seed
      : hashString(`${prompt}|${styleId}|${Date.now().toString(36)}`);

  const image: GalleryImage = {
    id: newId("img"),
    prompt,
    styleId,
    rating,
    dataUrl: imageUrl,
    seed,
    source: "generated",
    createdAt: new Date().toISOString(),
    threadId: input.threadId,
    entityTitle: input.entityTitle,
    costMoons: IMAGE_COST,
    model: api.model,
    fromModel: true,
  };
  const state = readImages();
  state.images.unshift(image);
  writeImages(state);
  return { ok: true, image, balance: spend.balance };
}

/** @deprecated Use generateImage — kept name for any leftover imports during transition. */
export const generateMockImage = generateImage;

export function attachImageToThread(imageId: string, threadId: string) {
  const state = readImages();
  const idx = state.images.findIndex((i) => i.id === imageId);
  if (idx < 0) return;
  state.images[idx] = { ...state.images[idx], threadId };
  writeImages(state);
}

export function failMessageTh(result: Extract<GenerateResult, { ok: false }>): string {
  if (result.messageTh) return result.messageTh;
  switch (result.reason) {
    case "empty_prompt":
      return "ใส่พรอมต์ก่อนสร้างภาพ";
    case "insufficient":
      return `พระจันทร์ไม่พอ (มี ${result.balance} ต้องการ ${result.need ?? IMAGE_COST}) — รับโบนัสที่กระเป๋า`;
    case "no_provider":
      return "ยังไม่ได้ตั้งค่าผู้ให้บริการสร้างภาพ (FAL_KEY) — ติดต่อผู้ดูแลระบบ";
    case "provider_auth":
      return "คีย์ผู้ให้บริการไม่ถูกต้องหรือหมดอายุ — ติดต่อผู้ดูแลระบบ";
    case "provider_forbidden":
      return "ผู้ให้บริการปฏิเสธคำขอ — บัญชีอาจไม่มีสิทธิ์";
    case "bad_input":
      return "พารามิเตอร์สร้างภาพไม่ถูกต้อง — ลองปรับพรอมต์";
    case "rate_limited":
      return "เรียกผู้ให้บริการถี่เกินไป — รอสักครู่แล้วลองใหม่";
    case "timeout":
      return "หมดเวลาสร้างภาพ — ลองใหม่";
    case "safe_mode":
      return "ถูกบล็อกโดยโหมดปลอดภัยของโมเดล — ลองปรับพรอมต์หรือเรตติ้ง";
    default:
      return "สร้างภาพไม่สำเร็จ — ผู้ให้บริการผิดพลาด ลองใหม่ภายหลัง";
  }
}
