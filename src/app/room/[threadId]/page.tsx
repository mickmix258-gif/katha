"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PlayRoom } from "@/components/play/play-room";
import { getGroupRoomByThread } from "@/lib/play/group-room-store";
import { resolveGroupEntity } from "@/lib/play/resolve-entity";
import { getThread } from "@/lib/play/thread-store";
import type { PlayEntity, PlayThread } from "@/lib/play/types";

export default function GroupRoomPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  const [thread, setThread] = useState<PlayThread | null | undefined>(undefined);
  const [entity, setEntity] = useState<PlayEntity | null>(null);

  useEffect(() => {
    const t = getThread(threadId);
    if (!t || t.mode !== "group") {
      setThread(null);
      return;
    }
    setThread(t);
    const room = getGroupRoomByThread(threadId);
    const kind = t.groupEntityKind ?? room?.entityKind ?? "character";
    setEntity(resolveGroupEntity(kind, t.entityId));
  }, [threadId]);

  if (thread === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังเปิดห้องกลุ่ม…</div>;
  }
  if (!thread || !entity) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl">ไม่พบห้องกลุ่ม</h1>
        <Link href="/play/group" className="mt-4 inline-block text-[var(--accent-2)]">
          ไปล็อบบี้กลุ่ม
        </Link>
      </div>
    );
  }

  return (
    <PlayRoom mode="group" entity={entity} initialThreadId={thread.id} />
  );
}
