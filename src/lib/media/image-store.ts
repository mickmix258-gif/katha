"use client";

import { characters } from "@/data/catalog";
import { newId } from "@/lib/user-works-store";
import { IMAGE_COST, spendMoons } from "@/lib/wallet-store";
import { hashString, renderMockImage, type StylePresetId } from "./mock-image";

export type GalleryImage = {
  id: string;
  prompt: string;
  styleId: string;
  rating: "safe" | "mature";
  dataUrl: string;
  seed: number;
  source: "generated" | "seed";
  createdAt: string;
  threadId?: string;
  entityTitle?: string;
  costMoons: number;
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

export type GenerateResult =
  | { ok: true; image: GalleryImage; balance: number }
  | { ok: false; reason: "insufficient" | "empty_prompt"; balance: number; need?: number };

export function generateMockImage(input: {
  prompt: string;
  styleId?: string;
  rating?: "safe" | "mature";
  threadId?: string;
  entityTitle?: string;
}): GenerateResult {
  const prompt = input.prompt.trim();
  if (!prompt) return { ok: false, reason: "empty_prompt", balance: 0 };
  const spend = spendMoons(IMAGE_COST, "image_spend", "สร้างภาพม็อก", {
    prompt: prompt.slice(0, 80),
  });
  if (!spend.ok) {
    return { ok: false, reason: "insufficient", balance: spend.balance, need: IMAGE_COST };
  }
  const styleId = input.styleId ?? "ink";
  const rating = input.rating ?? "safe";
  const seed = hashString(`${prompt}|${styleId}|${Date.now().toString(36)}`);
  const image: GalleryImage = {
    id: newId("img"),
    prompt,
    styleId,
    rating,
    dataUrl: renderMockImage({ prompt, styleId, seed, rating }),
    seed,
    source: "generated",
    createdAt: new Date().toISOString(),
    threadId: input.threadId,
    entityTitle: input.entityTitle,
    costMoons: IMAGE_COST,
  };
  const state = readImages();
  state.images.unshift(image);
  writeImages(state);
  return { ok: true, image, balance: spend.balance };
}

export function attachImageToThread(imageId: string, threadId: string) {
  const state = readImages();
  const idx = state.images.findIndex((i) => i.id === imageId);
  if (idx < 0) return;
  state.images[idx] = { ...state.images[idx], threadId };
  writeImages(state);
}
