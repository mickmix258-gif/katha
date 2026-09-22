"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PlayRoom } from "@/components/play/play-room";
import { resolvePlayEntity } from "@/lib/play/resolve-entity";
import { getThread } from "@/lib/play/thread-store";
import type { PlayEntity, PlayThread } from "@/lib/play/types";

export default function PlayThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  const [thread, setThread] = useState<PlayThread | null | undefined>(undefined);
  const [entity, setEntity] = useState<PlayEntity | null>(null);

  useEffect(() => {
    const t = getThread(threadId);
    if (!t) {
      setThread(null);
      return;
    }
    setThread(t);
    const mode = t.mode === "multi_npc" ? "scene" : t.mode;
    const resolved =
      resolvePlayEntity(t.mode === "multi_npc" ? "scene" : t.mode, t.entityId) ??
      resolvePlayEntity(mode, t.entityId);
    if (resolved && t.mode === "multi_npc") {
      setEntity({ ...resolved, mode: "multi_npc" });
    } else {
      setEntity(resolved);
    }
  }, [threadId]);

  if (thread === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังโหลด…</div>;
  }
  if (!thread || !entity) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl">ไม่พบบทนี้</h1>
        <Link href="/me/threads" className="mt-4 inline-block text-[var(--accent-2)]">
          ไปบทของฉัน
        </Link>
      </div>
    );
  }

  return (
    <PlayRoom
      mode={thread.mode}
      entity={entity}
      initialThreadId={thread.id}
      scenarioId={thread.scenarioId}
    />
  );
}
