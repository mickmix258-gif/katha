"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FollowButton } from "@/components/follow-button";
import { WorkActions } from "@/components/work-actions";
import { getCharacter, getScene, getWorld, tagLabel } from "@/data/catalog";
import {
  getUserCharacter,
  getUserScene,
  getUserWorld,
} from "@/lib/user-works-store";

type View = {
  id: string;
  creatorHandle: string;
  title: string;
  premise: string;
  openingNarration: string;
  tags: string[];
  npcIds: string[];
  worldCards: { title: string; type: string; body: string }[];
  worldId?: string;
  likeCount: number;
  status?: string;
  isOwner?: boolean;
};

function resolveNpcName(id: string) {
  return getCharacter(id)?.name ?? getUserCharacter(id)?.name;
}

function resolveWorldTitle(id: string) {
  return getWorld(id)?.title ?? getUserWorld(id)?.title;
}

export default function SceneDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<View | null | undefined>(undefined);
  const [worldTitle, setWorldTitle] = useState<string | undefined>();

  useEffect(() => {
    const seed = getScene(id);
    if (seed) {
      setItem({ ...seed, worldCards: seed.worldCards, isOwner: false });
      setWorldTitle(seed.worldId ? resolveWorldTitle(seed.worldId) : undefined);
      return;
    }
    const user = getUserScene(id);
    if (user) {
      setItem({
        id: user.id,
        creatorHandle: user.creatorHandle,
        title: user.title,
        premise: user.premise,
        openingNarration: user.openingNarration,
        tags: user.tags,
        npcIds: user.npcIds,
        worldCards: user.worldCards,
        worldId: user.worldId,
        likeCount: user.likeCount,
        status: user.status,
        isOwner: true,
      });
      setWorldTitle(user.worldId ? resolveWorldTitle(user.worldId) : undefined);
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
        <h1 className="text-2xl">ไม่พบฉากเรื่อง</h1>
        <Link href="/scenes" className="mt-4 inline-block text-[var(--accent-2)]">
          กลับตลาดฉาก
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-[var(--accent-2)]">
        ฉากเรื่อง{worldTitle ? ` · ${worldTitle}` : ""}
      </p>
      <h1 className="mt-2 text-4xl">{item.title}</h1>
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
      <p className="mt-6 leading-8">{item.openingNarration}</p>
      <h2 className="mt-8 text-xl">ตัวในเรื่อง</h2>
      <div className="mt-3 grid gap-2">
        {item.npcIds.map((npcId) => {
          const name = resolveNpcName(npcId);
          return name ? (
            <Link key={npcId} href={`/characters/${npcId}`} className="rounded-xl border border-[var(--line)] p-3">
              {name}
            </Link>
          ) : null;
        })}
        {!item.npcIds.length ? <p className="text-sm text-[var(--muted)]">ยังไม่มี NPC</p> : null}
      </div>
      <h2 className="mt-8 text-xl">ใบโลก</h2>
      <div className="mt-3 grid gap-2">
        {item.worldCards.map((card) => (
          <div key={card.title + card.type} className="rounded-xl border border-[var(--line)] p-3">
            <p className="text-sm text-[var(--accent-2)]">{card.type}</p>
            <p className="font-medium">{card.title}</p>
            <p className="text-sm text-[var(--muted)]">{card.body}</p>
          </div>
        ))}
        {!item.worldCards.length ? <p className="text-sm text-[var(--muted)]">ยังไม่มีใบโลก</p> : null}
      </div>
      {item.isOwner ? (
        <Link
          href={`/create/scene?id=${item.id}`}
          className="mt-6 inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm"
        >
          แก้ไข
        </Link>
      ) : null}
    </div>
  );
}
