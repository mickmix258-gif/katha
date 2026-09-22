"use client";

import Link from "next/link";
import { Suspense, use, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PlayRoom } from "@/components/play/play-room";
import { resolvePlayEntity } from "@/lib/play/resolve-entity";

function Inner({ id }: { id: string }) {
  const search = useSearchParams();
  const threadId = search.get("thread") ?? undefined;
  const entity = useMemo(() => resolvePlayEntity("world", id), [id]);

  if (!entity) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl">ไม่พบโลกสำหรับเล่น</h1>
        <Link href="/worlds" className="mt-4 inline-block text-[var(--accent-2)]">
          กลับตลาดโลก
        </Link>
      </div>
    );
  }

  return <PlayRoom mode="world" entity={entity} initialThreadId={threadId} />;
}

export default function PlayWorldPage({
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
