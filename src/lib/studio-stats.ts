"use client";

import { characters, scenes, worlds } from "@/data/catalog";
import { readSocial } from "@/lib/interaction-store";
import { listAllThreads } from "@/lib/play/thread-store";
import { getCreatorBalance, sumTipInForHandle } from "@/lib/wallet-store";
import { LOCAL_CREATOR, readWorks } from "@/lib/user-works-store";

export type StudioStats = {
  handle: string;
  impressions: number;
  starts: number;
  messages: number;
  likes: number;
  follows: number;
  earningsMoons: number;
  creatorSharePercent: number;
  worksPublished: number;
  tipReceived: number;
  balanceHeld: number;
};

export function computeStudioStats(handle: string = LOCAL_CREATOR): StudioStats {
  const works = readWorks();
  const myChars = works.characters.filter((c) => c.creatorHandle === handle);
  const myScenes = works.scenes.filter((c) => c.creatorHandle === handle);
  const myWorlds = works.worlds.filter((c) => c.creatorHandle === handle);
  const published =
    myChars.filter((c) => c.status === "published" || c.status === "pending_moderation").length +
    myScenes.filter((c) => c.status === "published" || c.status === "pending_moderation").length +
    myWorlds.filter((c) => c.status === "published" || c.status === "pending_moderation").length;

  const ownedIds = new Set([
    ...myChars.map((c) => c.id),
    ...myScenes.map((c) => c.id),
    ...myWorlds.map((c) => c.id),
  ]);

  const threads = listAllThreads().filter((t) => ownedIds.has(t.entityId));
  const starts = threads.length;
  const messages = threads.reduce((n, t) => n + t.messages.length, 0);

  const social = readSocial();
  const likes =
    social.liked.filter((id) => ownedIds.has(id)).length +
    myChars.reduce((n, c) => n + c.likeCount, 0) +
    myScenes.reduce((n, c) => n + c.likeCount, 0) +
    myWorlds.reduce((n, c) => n + c.likeCount, 0);

  const seedChars = characters.filter((c) => c.creatorHandle === "emmy");
  const seedScenes = scenes.filter((c) => c.creatorHandle === "emmy");
  const seedWorlds = worlds.filter((c) => c.creatorHandle === "emmy");
  const seedImpressions =
    seedChars.reduce((n, c) => n + c.messageCount + c.likeCount * 12, 0) +
    seedScenes.reduce((n, c) => n + c.playCount * 8 + c.likeCount * 10, 0) +
    seedWorlds.reduce((n, c) => n + c.playCount * 8 + c.likeCount * 10, 0);

  const localImpressions =
    myChars.reduce((n, c) => n + Math.max(c.likeCount, 1) * 15 + 40, 0) +
    myScenes.reduce((n, c) => n + Math.max(c.likeCount, 1) * 12 + 30, 0) +
    myWorlds.reduce((n, c) => n + Math.max(c.likeCount, 1) * 12 + 30, 0) +
    messages * 3 +
    starts * 20;

  const tipReceived = sumTipInForHandle(handle);
  const balanceHeld = getCreatorBalance(handle);
  const creatorSharePercent = 30;
  const shareStub = Math.floor(seedImpressions * 0.00002 * creatorSharePercent);
  const earningsMoons = tipReceived + balanceHeld + shareStub;

  return {
    handle,
    impressions: localImpressions + Math.floor(seedImpressions * 0.15),
    starts: starts + seedScenes.reduce((n, s) => n + Math.min(s.playCount, 50), 0),
    messages:
      messages +
      seedChars.reduce((n, c) => n + Math.min(Math.floor(c.messageCount / 100), 80), 0),
    likes:
      likes +
      seedChars.reduce((n, c) => n + Math.min(c.likeCount, 40), 0) +
      seedScenes.reduce((n, c) => n + Math.min(c.likeCount, 20), 0),
    follows: social.following.includes(handle)
      ? 1
      : handle === LOCAL_CREATOR
        ? 3 + social.following.length
        : 12,
    earningsMoons,
    creatorSharePercent,
    worksPublished: published,
    tipReceived,
    balanceHeld,
  };
}
