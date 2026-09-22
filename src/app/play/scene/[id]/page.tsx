"use client";

import Link from "next/link";
import { Suspense, use, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PlayRoom } from "@/components/play/play-room";
import { resolvePlayEntity } from "@/lib/play/resolve-entity";

function Inner({ id }: { id: string }) {
  const search = useSearchParams();
  const threadId = search.get("thread") ?? undefined;
  const forceMulti = search.get("mode") === "multi_npc";
  const entity = useMemo(() => {
    const base = resolvePlayEntity("scene", id);
    if (!base) return null;
    if (forceMulti || base.mode === "multi_npc") {
      return { ...base, mode: "multi_npc" as const };
    }
    return base;
  }, [id, forceMulti]);

  if (!entity) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl">ไม่พบฉากสำหรับเล่น</h1>
        <Link href="/scenes" className="mt-4 inline-block text-[var(--accent-2)]">
          กลับตลาดฉาก
        </Link>
      </div>
    );
  }

  return (
    <PlayRoom mode={entity.mode} entity={entity} initialThreadId={threadId} />
  );
}

export default function PlayScenePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="px-4 py-10 text-[var(--muted)]">กำลังเปิดห้องบท…</div>}>
      <Inner id={id} />
    </Suspense>
  );
}
