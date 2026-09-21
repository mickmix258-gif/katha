"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CatalogCard } from "@/components/catalog-card";
import { CatalogFilters } from "@/components/catalog-filters";
import type { CharacterRecord, SceneRecord, WorldRecord } from "@/data/catalog";
import { filterAndSortWorks, parseCatalogParams } from "@/lib/catalog-query";
import { readSocial, type SocialState } from "@/lib/interaction-store";

type Props = {
  title: string;
  subtitle?: string;
  characters?: CharacterRecord[];
  scenes?: SceneRecord[];
  worlds?: WorldRecord[];
  showGender?: boolean;
};

function BrowserInner({ title, subtitle, characters = [], scenes = [], worlds = [], showGender }: Props) {
  const searchParams = useSearchParams();
  const params = useMemo(
    () => parseCatalogParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const [social, setSocial] = useState<SocialState | undefined>(undefined);

  useEffect(() => {
    const sync = () => setSocial(readSocial());
    sync();
    window.addEventListener("katha-social", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("katha-social", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const filteredCharacters = filterAndSortWorks(characters, params, social, { kind: "character" });
  const filteredScenes = filterAndSortWorks(scenes, params, social, { kind: "scene" });
  const filteredWorlds = filterAndSortWorks(worlds, params, social, { kind: "world" });

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
