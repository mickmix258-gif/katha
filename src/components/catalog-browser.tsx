"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CatalogCard } from "@/components/catalog-card";
import { CatalogFilters } from "@/components/catalog-filters";
import type { CharacterRecord, SceneRecord, WorldRecord } from "@/data/catalog";
import { filterAndSortWorks, parseCatalogParams } from "@/lib/catalog-query";
import { readSocial, type SocialState } from "@/lib/interaction-store";
import {
  LOCAL_CREATOR,
  publishedCharacters,
  publishedScenes,
  publishedWorlds,
  type UserCharacter,
  type UserScene,
  type UserWorld,
} from "@/lib/user-works-store";

type Props = {
  title: string;
  subtitle?: string;
  characters?: CharacterRecord[];
  scenes?: SceneRecord[];
  worlds?: WorldRecord[];
  showGender?: boolean;
};

function toCharRecord(c: UserCharacter): CharacterRecord {
  return {
    id: c.id,
    creatorHandle: c.creatorHandle,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    personality: c.personality,
    speakingStyle: c.speakingStyle,
    greeting: c.greeting,
    genderPresentation: c.genderPresentation,
    appearancePrompt: c.appearancePrompt,
    rating: c.rating,
    nsfwIntensity: c.nsfwIntensity,
    tags: c.tags,
    hashtags: c.hashtags,
    messageCount: c.messageCount,
    likeCount: c.likeCount,
    featured: c.featured,
    age: c.age,
    publishedAt: c.publishedAt,
  };
}

function toSceneRecord(s: UserScene): SceneRecord {
  return {
    id: s.id,
    creatorHandle: s.creatorHandle,
    worldId: s.worldId,
    title: s.title,
    premise: s.premise,
    openingNarration: s.openingNarration,
    setting: s.setting,
    tone: s.tone,
    playerRole: s.playerRole,
    rating: s.rating,
    tags: s.tags,
    npcIds: s.npcIds,
    worldCards: s.worldCards.map((w) => ({
      title: w.title,
      type: w.type,
      body: w.body,
      alwaysOn: w.alwaysOn,
    })),
    playCount: s.playCount,
    likeCount: s.likeCount,
    featured: s.featured,
    publishedAt: s.publishedAt,
  };
}

function toWorldRecord(w: UserWorld): WorldRecord {
  return {
    id: w.id,
    creatorHandle: w.creatorHandle,
    title: w.title,
    premise: w.premise,
    setting: w.setting,
    tone: w.tone,
    lore: w.lore,
    rating: w.rating,
    tags: w.tags,
    residentIds: w.residentIds,
    playCount: w.playCount,
    likeCount: w.likeCount,
    featured: w.featured,
    publishedAt: w.publishedAt,
  };
}

function mergeById<T extends { id: string }>(seed: T[], extra: T[]): T[] {
  const map = new Map<string, T>();
  seed.forEach((i) => map.set(i.id, i));
  extra.forEach((i) => map.set(i.id, i));
  return [...map.values()];
}

function BrowserInner({ title, subtitle, characters = [], scenes = [], worlds = [], showGender }: Props) {
  const searchParams = useSearchParams();
  const params = useMemo(
    () => parseCatalogParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const [social, setSocial] = useState<SocialState | undefined>(undefined);
  const [userChars, setUserChars] = useState<CharacterRecord[]>([]);
  const [userScenes, setUserScenes] = useState<SceneRecord[]>([]);
  const [userWorlds, setUserWorlds] = useState<WorldRecord[]>([]);

  useEffect(() => {
    const sync = () => {
      setSocial(readSocial());
      setUserChars(publishedCharacters().map(toCharRecord));
      setUserScenes(publishedScenes().map(toSceneRecord));
      setUserWorlds(publishedWorlds().map(toWorldRecord));
    };
    sync();
    window.addEventListener("katha-social", sync);
    window.addEventListener("katha-works", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("katha-social", sync);
      window.removeEventListener("katha-works", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const allCharacters = mergeById(characters, userChars);
  const allScenes = mergeById(scenes, userScenes);
  const allWorlds = mergeById(worlds, userWorlds);

  const socialWithMine = social
    ? { ...social, following: social.following }
    : undefined;

  const filteredCharacters = filterAndSortWorks(allCharacters, params, socialWithMine, {
    kind: "character",
    mineHandle: LOCAL_CREATOR,
  });
  const filteredScenes = filterAndSortWorks(allScenes, params, socialWithMine, {
    kind: "scene",
    mineHandle: LOCAL_CREATOR,
  });
  const filteredWorlds = filterAndSortWorks(allWorlds, params, socialWithMine, {
    kind: "world",
    mineHandle: LOCAL_CREATOR,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-[var(--muted)]">{subtitle}</p> : null}
      <CatalogFilters showGender={showGender} />
      <div className="card-grid mt-8">
        {filteredCharacters.map((item) => (
          <CatalogCard
            key={item.id}
            href={`/characters/${item.id}`}
            title={item.name}
            subtitle={item.tagline}
            tags={item.tags}
            rating={item.rating}
            meta={`${item.messageCount.toLocaleString()} บท · ${item.likeCount.toLocaleString()} ถูกใจ`}
          />
        ))}
        {filteredScenes.map((item) => (
          <CatalogCard
            key={item.id}
            href={`/scenes/${item.id}`}
            title={item.title}
            subtitle={item.premise}
            tags={item.tags}
            rating={item.rating}
            meta={`${item.playCount.toLocaleString()} เล่น · ${(item.likeCount ?? 0).toLocaleString()} ถูกใจ`}
          />
        ))}
        {filteredWorlds.map((item) => (
          <CatalogCard
            key={item.id}
            href={`/worlds/${item.id}`}
            title={item.title}
            subtitle={item.premise}
            tags={item.tags}
            rating={item.rating}
            meta={`โลก · ${(item.playCount ?? 0).toLocaleString()} เล่น`}
          />
        ))}
      </div>
      {!filteredCharacters.length && !filteredScenes.length && !filteredWorlds.length ? (
        <p className="mt-10 text-center text-[var(--muted)]">ไม่พบรายการตามตัวกรองนี้</p>
      ) : null}
    </div>
  );
}

export function CatalogBrowser(props: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10">กำลังโหลดตัวกรอง…</div>}>
      <BrowserInner {...props} />
    </Suspense>
  );
}
