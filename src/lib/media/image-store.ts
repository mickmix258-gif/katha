"use client";

import { characters } from "@/data/catalog";
import { newId } from "@/lib/user-works-store";
import { IMAGE_COST, readWallet, spendMoons, writeWallet } from "@/lib/wallet-store";
import { hashString, renderMockImage, type StylePresetId } from "./mock-image";

export type GalleryImage = {
  id: string;
  prompt: string;
  styleId: string;
  rating: "safe" | "mature";
  /** HTTPS image URL from provider, or SVG data URL (seed placeholders). */
  dataUrl: string;
  seed: number;
  source: "generated" | "seed";
  createdAt: string;
  threadId?: string;
  entityTitle?: string;
  costMoons: number;
  /** Present when generated via a real image model/service. */
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
  | "sfw_blocked"
  | "bad_request"
  | "unauthorized";

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
  charged?: boolean;
  balance?: number;
  costMoons?: number;
};

type ApiFail = {
  ok: false;
  reason?: GenerateFailReason;
  messageTh?: string;
  balance?: number;
  need?: number;
  charged?: boolean;
};

/**
 * Real model generation via `/api/images/generate` (server control plane).
 * Browser never calls Pollinations/fal directly and never sees provider keys.
 *
 * When auth is configured: server deducts moons after success (`charged: true`).
 * When auth is off: client deducts from local wallet after success (MVP fallback).
 * Rate-limit 429 never charges.
 */
export async function generateImage(input: {
  prompt: string;
  styleId?: string;
  rating?: "safe" | "mature";
  threadId?: string;
  entityTitle?: string;
}): Promise<GenerateResult> {
  const prompt = input.prompt.trim();
  const localBalance = readWallet().balance;
  if (!prompt) return { ok: false, reason: "empty_prompt", balance: localBalance };

  // Soft local pre-check (authoritative check is server when auth is on).
  if (localBalance < IMAGE_COST) {
    // Still attempt server path — logged-in users may have server balance only.
  }

  let api: ApiOk | ApiFail;
  let httpStatus = 0;
  try {
    const res = await fetch("/api/images/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        styleId: input.styleId ?? "ink",
        // Emmy lock: always request safe; server ignores mature anyway.
        rating: "safe",
      }),
    });
    httpStatus = res.status;
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
    // Includes sfw_blocked / rate_limited / errors — never deduct moons (charged:false).
    const balance =
      typeof api.balance === "number" ? api.balance : readWallet().balance;
    if (typeof api.balance === "number") {
      // Sync local display cache when server reported balance
      const w = readWallet();
      writeWallet({ ...w, balance: api.balance });
    }
    return {
      ok: false,
      reason:
        api.reason ??
        (httpStatus === 429
          ? "rate_limited"
          : httpStatus === 401
            ? "unauthorized"
            : "provider_error"),
      balance,
      need: api.need,
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

  let balanceAfter: number;
  if (api.charged && typeof api.balance === "number") {
    // Server already deducted — sync local display wallet; do NOT spend again.
    const w = readWallet();
    writeWallet({ ...w, balance: api.balance });
    balanceAfter = api.balance;
  } else {
    // Auth not configured: charge local wallet only after success.
    const spend = spendMoons(IMAGE_COST, "image_spend", "สร้างภาพ", {
      prompt: prompt.slice(0, 80),
      model: api.model ?? "",
    });
    if (!spend.ok) {
      return { ok: false, reason: "insufficient", balance: spend.balance, need: IMAGE_COST };
    }
    balanceAfter = spend.balance;
  }

  const styleId = input.styleId ?? "ink";
  // Generated images are always stored as safe (SFW-only policy).
  const rating = "safe" as const;
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
  return { ok: true, image, balance: balanceAfter };
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
    case "unauthorized":
      return "กรุณาเข้าสู่ระบบก่อนสร้างภาพ";
    case "no_provider":
      return "บริการสร้างภาพยังไม่พร้อม — ลองใหม่ภายหลังหรือติดต่อผู้ดูแลระบบ";
    case "provider_auth":
      return "คีย์ผู้ให้บริการไม่ถูกต้องหรือหมดอายุ — ติดต่อผู้ดูแลระบบ";
    case "provider_forbidden":
      return "ผู้ให้บริการปฏิเสธคำขอ — บัญชีอาจไม่มีสิทธิ์";
    case "bad_input":
      return "พารามิเตอร์สร้างภาพไม่ถูกต้อง — ลองปรับพรอมต์";
    case "rate_limited":
      return "เรียกสร้างภาพถี่เกินไป — รอสักครู่แล้วลองใหม่";
    case "timeout":
      return "หมดเวลาสร้างภาพ — ลองใหม่";
    case "safe_mode":
      return "ถูกบล็อกโดยโหมดปลอดภัยของโมเดล — ลองปรับพรอมต์ (สูงสุดเซ็กซี่ระดับชุดว่ายน้ำ)";
    case "sfw_blocked":
      return "ไม่อนุญาตภาพเปลือยหรือโป๊ — ขอบเขตสูงสุดคือเซ็กซี่ระดับชุดว่ายน้ำ";
    default:
      return "สร้างภาพไม่สำเร็จ — ผู้ให้บริการผิดพลาด ลองใหม่ภายหลัง";
  }
}
