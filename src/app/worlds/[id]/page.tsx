"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FollowButton } from "@/components/follow-button";
import { WorkActions } from "@/components/work-actions";
import { getCharacter, getWorld, scenes, tagLabel } from "@/data/catalog";
import {
  getUserCharacter,
  getUserWorld,
  publishedScenes,
  readWorks,
} from "@/lib/user-works-store";

type View = {
  id: string;
  creatorHandle: string;
  title: string;
  premise: string;
  lore: string;
  tags: string[];
  residentIds: string[];
  likeCount: number;
  status?: string;
  isOwner?: boolean;
};

export default function WorldDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<View | null | undefined>(undefined);
  const [worldScenes, setWorldScenes] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const seed = getWorld(id);
    if (seed) {
      setItem({ ...seed, isOwner: false });
      const userScenes = [...readWorks().scenes, ...publishedScenes()].filter((s) => s.worldId === id);
      setWorldScenes([
        ...scenes.filter((s) => s.worldId === id).map((s) => ({ id: s.id, title: s.title })),
        ...userScenes.map((s) => ({ id: s.id, title: s.title })),
      ]);
      return;
    }
    const user = getUserWorld(id);
    if (user) {
      setItem({
        id: user.id,
        creatorHandle: user.creatorHandle,
        title: user.title,
        premise: user.premise,
        lore: user.lore,
        tags: user.tags,
        residentIds: user.residentIds,
        likeCount: user.likeCount,
        status: user.status,
        isOwner: true,
      });
      const userScenes = readWorks().scenes.filter((s) => s.worldId === id);
      setWorldScenes(userScenes.map((s) => ({ id: s.id, title: s.title })));
      return;
    }
    setItem(null);
  }, [id]);

  if (item === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังโหลด…</div>;
  }
  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl">ไม่พบโลก</h1>
        <Link href="/worlds" className="mt-4 inline-block text-[var(--accent-2)]">
          กลับตลาดโลก
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl">{item.title}</h1>
      {item.status === "pending_moderation" ? (
        <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--accent-2)]">
          สถานะ: รอตรวจ (stub)
        </p>
      ) : null}
      <FollowButton handle={item.creatorHandle} />
      <WorkActions workId={item.id} baseLikes={item.likeCount ?? 0} />
      <p className="mt-3 text-[var(--muted)]">{item.premise}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm">
            {tagLabel(tag)}
          </span>
        ))}
      </div>
      <p className="mt-6 leading-8">{item.lore}</p>
      <h2 className="mt-8 text-xl">ผู้อยู่อาศัย</h2>
      <div className="mt-3 grid gap-2">
        {item.residentIds.map((residentId) => {
          const resident = getCharacter(residentId) ?? getUserCharacter(residentId);
          return resident ? (
            <Link key={residentId} href={`/characters/${residentId}`} className="rounded-xl border border-[var(--line)] p-3">
              {"name" in resident ? resident.name : residentId}
            </Link>
          ) : null;
        })}
      </div>
      <h2 className="mt-8 text-xl">ฉากในโลกนี้</h2>
      <div className="mt-3 grid gap-2">
        {worldScenes.map((scene) => (
          <Link key={scene.id} href={`/scenes/${scene.id}`} className="rounded-xl border border-[var(--line)] p-3">
            {scene.title}
          </Link>
        ))}
        {!worldScenes.length ? <p className="text-sm text-[var(--muted)]">ยังไม่มีฉาก</p> : null}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/play/world/${item.id}`}
          className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm text-white"
        >
          เริ่มท่องโลก
        </Link>
        {item.isOwner ? (
          <Link
            href={`/create/world?id=${item.id}`}
            className="inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm"
          >
            แก้ไข
          </Link>
        ) : null}
      </div>
    </div>
  );
}
