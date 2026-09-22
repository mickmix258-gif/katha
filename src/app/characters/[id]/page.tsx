"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FollowButton } from "@/components/follow-button";
import { WorkActions } from "@/components/work-actions";
import { getCharacter, tagLabel } from "@/data/catalog";
import {
  getUserCharacter,
  type UserCharacter,
} from "@/lib/user-works-store";

type View = {
  id: string;
  creatorHandle: string;
  name: string;
  tagline: string;
  description: string;
  personality: string;
  speakingStyle: string;
  greeting: string;
  tags: string[];
  age: number;
  likeCount: number;
  status?: string;
  scenarios?: UserCharacter["scenarios"];
  isOwner?: boolean;
};

export default function CharacterDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<View | null | undefined>(undefined);

  useEffect(() => {
    const seed = getCharacter(id);
    if (seed) {
      setItem({ ...seed, isOwner: false });
      return;
    }
    const user = getUserCharacter(id);
    if (user && (user.status === "published" || user.status === "pending_moderation" || user.status === "draft")) {
      // drafts only visible to owner (local); show for local creator
      if (user.status === "draft") {
        setItem({
          id: user.id,
          creatorHandle: user.creatorHandle,
          name: user.name,
          tagline: user.tagline,
          description: user.description,
          personality: user.personality,
          speakingStyle: user.speakingStyle,
          greeting: user.greeting,
          tags: user.tags,
          age: user.age,
          likeCount: user.likeCount,
          status: user.status,
          scenarios: user.scenarios,
          isOwner: true,
        });
        return;
      }
      setItem({
        id: user.id,
        creatorHandle: user.creatorHandle,
        name: user.name,
        tagline: user.tagline,
        description: user.description,
        personality: user.personality,
        speakingStyle: user.speakingStyle,
        greeting: user.greeting,
        tags: user.tags,
        age: user.age,
        likeCount: user.likeCount,
        status: user.status,
        scenarios: user.scenarios,
        isOwner: true,
      });
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
        <h1 className="text-2xl">ไม่พบตัวละคร</h1>
        <Link href="/characters" className="mt-4 inline-block text-[var(--accent-2)]">
          กลับตลาดตัวละคร
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-[var(--accent-2)]">
        <Link href={`/c/${item.creatorHandle}`}>@{item.creatorHandle}</Link> · อายุ {item.age}
      </p>
      <h1 className="mt-2 text-4xl">{item.name}</h1>
      <p className="mt-3 text-lg text-[var(--muted)]">{item.tagline}</p>
      {item.status === "pending_moderation" ? (
        <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--accent-2)]">
          สถานะ: รอตรวจ (stub) — ยังแสดงในแค็ตตาล็อกได้
        </p>
      ) : null}
      {item.status === "draft" ? (
        <p className="mt-3 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]">
          ฉบับร่าง · ยังไม่เผยแพร่สาธารณะ
        </p>
      ) : null}
      <FollowButton handle={item.creatorHandle} />
      <WorkActions workId={item.id} baseLikes={item.likeCount} />
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <Link
            key={tag}
            href={`/explore?tags=${tag}`}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-sm"
          >
            {tagLabel(tag)}
          </Link>
        ))}
      </div>
      <p className="mt-6 leading-8 text-[var(--text)]">{item.description}</p>
      <dl className="mt-8 grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 text-sm">
        <div>
          <dt className="text-[var(--muted)]">บุคลิก</dt>
          <dd>{item.personality}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">วิธีพูด</dt>
          <dd>{item.speakingStyle}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">คำทักทาย</dt>
          <dd>{item.greeting}</dd>
        </div>
      </dl>
      {/* systemInstruction intentionally never rendered for public/anonymous viewers */}
      {item.scenarios && item.scenarios.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xl">บทเปิด</h2>
          <div className="mt-3 grid gap-2">
            {item.scenarios.map((s) => (
              <div key={s.id} className="rounded-xl border border-[var(--line)] p-3">
                <p className="font-medium">{s.title || "ไม่มีชื่อ"}</p>
                <p className="text-sm text-[var(--muted)]">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {item.isOwner ? (
        <Link
          href={`/create/character?id=${item.id}`}
          className="mt-6 mr-3 inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm"
        >
          แก้ไข
        </Link>
      ) : null}
      {item.status !== "draft" ? (
        <Link
          href={`/play/character/${item.id}`}
          className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm text-white"
        >
          เริ่มบท
        </Link>
      ) : (
        <Link
          href={`/play/character/${item.id}`}
          className="mt-8 inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm"
        >
          ทดลองเล่นฉบับร่าง
        </Link>
      )}
      {item.scenarios && item.scenarios.some((s) => s.firstMessage || s.title) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.scenarios.map((s) => (
            <Link
              key={s.id}
              href={`/play/character/${item.id}?scenario=${s.id}`}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]"
            >
              เล่นบทเปิด: {s.title || "ไม่มีชื่อ"}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
